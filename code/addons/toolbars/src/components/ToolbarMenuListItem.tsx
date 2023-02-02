import type { ComponentProps } from 'react';
import React from 'react';
import type { ListItem } from '@storybook/components';
import { Icons } from '@storybook/components';
import type { ToolbarItem } from '../types';

type ToolbarMenuListItemProps = {
  currentValue: string;
  onClick: () => void;
} & ToolbarItem;

export const ToolbarMenuListItem = ({
  left,
  right,
  title,
  value,
  icon,
  hideIcon,
  onClick,
  currentValue,
}: ToolbarMenuListItemProps) => {
  const Icon = icon && <Icons style={{ opacity: 1 }} icon={icon} />;

  const Item: ComponentProps<typeof ListItem> = {
    id: value || currentValue,
    active: currentValue === value,
    right,
    title,
    left,
    onClick,
  };

  if (icon && !hideIcon) {
    Item.left = Icon;
  }

  return Item;
};
