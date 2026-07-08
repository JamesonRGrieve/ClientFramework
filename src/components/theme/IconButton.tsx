// IconButton.tsx
import type { ComponentType, ReactNode } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface IconButtonProps extends ButtonProps {
  Icon: ComponentType<{ className?: string }>;
  label: ReactNode;
  description: ReactNode;
}

export default function IconButton({ Icon, label, description, ...props }: IconButtonProps): React.JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className='inline-block'>
          <Button {...props} className={cn('icon-btn', props.className || '')}>
            <Icon className='icon' />
            <span className='label'>{label}</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );
}
