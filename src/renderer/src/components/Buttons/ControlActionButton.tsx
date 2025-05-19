import { ActionIcon, ActionIconProps } from "@mantine/core";
import { ReactNode } from "react";

import classes from './ControlActionButton.module.css'

interface ControlActionButtonProps extends ActionIconProps {
    children: ReactNode;
    onClick?: () => void
}

export function ControlActionButton ({children, onClick, className, variant="subtle", ...rest  
}: ControlActionButtonProps) {

    return (
        <ActionIcon
            variant={variant}
            className={`${classes.icon} ${className ?? ""}`}
            onClick={onClick}
            style={{}}
            {...rest}
        >
            {children}
        </ActionIcon>
    )

}