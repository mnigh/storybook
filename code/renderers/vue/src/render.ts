/* eslint-disable no-underscore-dangle */
import { dedent } from 'ts-dedent';
import Vue from 'vue';
import type { RenderContext } from '@storybook/store';
import type { ArgsStoryFn } from '@storybook/csf';
import { CombinedVueInstance } from 'vue/types/vue';
import type { VueFramework } from './types';

export const COMPONENT = 'STORYBOOK_COMPONENT';
export const VALUES = 'STORYBOOK_VALUES';

const map = new Map<Element, [Instance, Element]>();
type Instance = CombinedVueInstance<
  Vue,
  {
    STORYBOOK_COMPONENT: any;
    STORYBOOK_VALUES: Record<string, unknown>;
  },
  object,
  object,
  Record<never, any>,
  unknown
>;
const getRoot = (domElement: Element): [Instance, Element] => {
  if (map.has(domElement)) {
    return map.get(domElement);
  }

  // Create a dummy "target" underneath #storybook-root
  // that Vue2 will replace on first render with #storybook-vue-root
  const target = document.createElement('div');
  domElement.appendChild(target);

  const instance = new Vue({
    beforeDestroy() {
      map.delete(domElement);
    },
    data() {
      return {
        [COMPONENT]: undefined,
        [VALUES]: {},
      };
    },
    render(h) {
      map.set(domElement, [instance, target]);
      const children = this[COMPONENT] ? [h(this[COMPONENT])] : undefined;
      return h('div', { attrs: { id: 'storybook-vue-root' } }, children);
    },
  });

  return [instance, target];
};

export const render: ArgsStoryFn<VueFramework> = (args, context) => {
  const { id, component: Component, argTypes } = context;
  const component = Component as VueFramework['component'] & {
    __docgenInfo?: { displayName: string };
    props: Record<string, any>;
  };

  if (!component) {
    throw new Error(
      `Unable to render story ${id} as the component annotation is missing from the default export`
    );
  }

  let componentName = 'component';

  // if there is a name property, we either use it or preprend with sb- in case it's an invalid name
  if (component.name) {
    // @ts-expect-error isReservedTag is an internal function from Vue, might be changed in future releases
    const isReservedTag = Vue.config.isReservedTag && Vue.config.isReservedTag(component.name);

    componentName = isReservedTag ? `sb-${component.name}` : component.name;
  } else if (component.__docgenInfo?.displayName) {
    // otherwise, we use the displayName from docgen, if present
    componentName = component.__docgenInfo?.displayName;
  }

  return {
    props: Object.keys(argTypes),
    data() {
      return { args };
    },
    components: { [componentName]: component },
    template: `<${componentName} v-bind="args" />`,
  };
};

export function renderToDOM(
  {
    title,
    name,
    storyFn,
    storyContext: { args },
    showMain,
    showError,
    showException,
    forceRemount,
  }: RenderContext<VueFramework>,
  domElement: Element
) {
  const [root, target] = getRoot(domElement);
  Vue.config.errorHandler = showException;
  const element = storyFn();

  if (!element) {
    showError({
      title: `Expecting a Vue component from the story: "${name}" of "${title}".`,
      description: dedent`
        Did you forget to return the Vue component from the story?
        Use "() => ({ template: '<my-comp></my-comp>' })" or "() => ({ components: MyComp, template: '<my-comp></my-comp>' })" when defining the story.
      `,
    });
    return;
  }

  // at component creation || refresh by HMR or switching stories
  if (!root[COMPONENT] || forceRemount) {
    root[COMPONENT] = element;
  }

  // @ts-expect-error https://github.com/storybookjs/storrybook/pull/7578#discussion_r307986139
  root[VALUES] = { ...element.options[VALUES], ...args };

  if (!map.has(domElement)) {
    root.$mount(target);
  }

  showMain();
}
