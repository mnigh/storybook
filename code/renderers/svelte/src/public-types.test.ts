import { describe, test } from '@jest/globals';
import type { ComponentAnnotations, StoryAnnotations } from '@storybook/types';
import { expectTypeOf } from 'expect-type';
import type { ComponentProps, SvelteComponentTyped } from 'svelte';
import Button from './__test__/Button.svelte';
import Decorator from './__test__/Decorator.svelte';
import Decorator2 from './__test__/Decorator2.svelte';

import type { DecoratorFn, Meta, StoryObj } from './public-types';
import type { SvelteFramework } from './types';

type SvelteStory<Component extends SvelteComponentTyped, Args, RequiredArgs> = StoryAnnotations<
  SvelteFramework<Component>,
  Args,
  RequiredArgs
>;

describe('Meta', () => {
  test('Generic parameter of Meta can be a component', () => {
    const meta: Meta<Button> = {
      component: Button,
      args: {
        label: 'good',
        disabled: false,
      },
    };

    expectTypeOf(meta).toEqualTypeOf<
      ComponentAnnotations<SvelteFramework<Button>, { disabled: boolean; label: string }>
    >();
  });

  test('Generic parameter of Meta can be the props of the component', () => {
    const meta: Meta<{ disabled: boolean; label: string }> = {
      component: Button,
      args: { label: 'good', disabled: false },
    };

    expectTypeOf(meta).toEqualTypeOf<
      ComponentAnnotations<SvelteFramework, { disabled: boolean; label: string }>
    >();
  });

  test('Events are inferred from component', () => {
    ({
      component: Button,
      args: {
        label: 'good',
        disabled: false,
      },
      render: (args) => ({
        Component: Button,
        props: args,
        on: {
          mousemove: (event) => {
            expectTypeOf(event).toEqualTypeOf<MouseEvent>();
          },
        },
      }),
    }) satisfies Meta<Button>;
  });

  test('Events fallback to custom events when no component is specified', () => {
    ({
      component: Button,
      args: { label: 'good', disabled: false },
      render: (args) => ({
        Component: Button,
        props: args,
        on: {
          mousemove: (event) => {
            expectTypeOf(event).toEqualTypeOf<CustomEvent>();
          },
        },
      }),
    }) satisfies Meta<{ disabled: boolean; label: string }>;
  });
});

describe('StoryObj', () => {
  test('✅ Required args may be provided partial in meta and the story', () => {
    const meta = {
      component: Button,
      args: { label: 'good' },
    } satisfies Meta<Button>;

    type Actual = StoryObj<typeof meta>;
    type Expected = SvelteStory<
      Button,
      { disabled: boolean; label: string },
      { disabled: boolean; label?: string }
    >;
    expectTypeOf<Actual>().toEqualTypeOf<Expected>();
  });

  test('❌ The combined shape of meta args and story args must match the required args.', () => {
    {
      const meta = { component: Button } satisfies Meta<Button>;

      type Expected = SvelteStory<
        Button,
        { disabled: boolean; label: string },
        { disabled: boolean; label: string }
      >;
      expectTypeOf<StoryObj<typeof meta>>().toEqualTypeOf<Expected>();
    }
    {
      const meta = {
        component: Button,
        args: { label: 'good' },
      } satisfies Meta<Button>;
      // @ts-expect-error disabled not provided ❌
      const Basic: StoryObj<typeof meta> = {};

      type Expected = SvelteStory<
        Button,
        { disabled: boolean; label: string },
        { disabled: boolean; label?: string }
      >;
      expectTypeOf(Basic).toEqualTypeOf<Expected>();
    }
    {
      const meta = { component: Button } satisfies Meta<{ label: string; disabled: boolean }>;
      const Basic: StoryObj<typeof meta> = {
        // @ts-expect-error disabled not provided ❌
        args: { label: 'good' },
      };

      type Expected = SvelteStory<
        Button,
        { disabled: boolean; label: string },
        { disabled: boolean; label: string }
      >;
      expectTypeOf(Basic).toEqualTypeOf<Expected>();
    }
  });

  test('Component can be used as generic parameter for StoryObj', () => {
    expectTypeOf<StoryObj<Button>>().toEqualTypeOf<
      SvelteStory<
        Button,
        { disabled: boolean; label: string },
        { disabled?: boolean; label?: string }
      >
    >();
  });
});

type ThemeData = 'light' | 'dark';

describe('Story args can be inferred', () => {
  test('Correct args are inferred when type is widened for render function', () => {
    const meta = {
      component: Button,
      args: { disabled: false },
      render: (args, { component }) => {
        return {
          Component: component,
          props: args,
        };
      },
    } satisfies Meta<ComponentProps<Button> & { theme: ThemeData }>;

    const Basic: StoryObj<typeof meta> = { args: { theme: 'light', label: 'good' } };

    type Expected = SvelteStory<
      Button,
      { theme: ThemeData; disabled: boolean; label: string },
      { theme: ThemeData; disabled?: boolean; label: string }
    >;
    expectTypeOf(Basic).toEqualTypeOf<Expected>();
  });

  const withDecorator: DecoratorFn<{ decoratorArg: string }> = (
    storyFn,
    { args: { decoratorArg } }
  ) => ({
    Component: Decorator,
    props: { decoratorArg },
  });

  test('Correct args are inferred when type is widened for decorators', () => {
    type Props = ComponentProps<Button> & { decoratorArg: string };

    const meta = {
      component: Button,
      args: { disabled: false },
      decorators: [withDecorator],
    } satisfies Meta<Props>;

    const Basic: StoryObj<typeof meta> = { args: { decoratorArg: 'title', label: 'good' } };

    type Expected = SvelteStory<
      Button,
      Props,
      { decoratorArg: string; disabled?: boolean; label: string }
    >;
    expectTypeOf(Basic).toEqualTypeOf<Expected>();
  });

  test('Correct args are inferred when type is widened for multiple decorators', () => {
    type Props = ComponentProps<Button> & { decoratorArg: string; decoratorArg2: string };

    const secondDecorator: DecoratorFn<{ decoratorArg2: string }> = (
      storyFn,
      { args: { decoratorArg2 } }
    ) => ({
      Component: Decorator2,
      props: { decoratorArg2 },
    });

    const meta = {
      component: Button,
      args: { disabled: false },
      decorators: [withDecorator, secondDecorator],
    } satisfies Meta<Props>;

    const Basic: StoryObj<typeof meta> = {
      args: { decoratorArg: '', decoratorArg2: '', label: 'good' },
    };

    type Expected = SvelteStory<
      Button,
      Props,
      { decoratorArg: string; decoratorArg2: string; disabled?: boolean; label: string }
    >;
    expectTypeOf(Basic).toEqualTypeOf<Expected>();
  });
});
