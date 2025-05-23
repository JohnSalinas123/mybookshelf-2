import { Button, ButtonProps } from "@mantine/core";                            

import classes from './ControlButton.module.css'

interface ControlButtonProps extends ButtonProps {
    children: string;
    onClick?: () => void;
}

// Maybe: add option for adding an icon? on left or right side.
// Maybe: add option for disabled and/or loading state if needed
export function ControlButton ({children, onClick, className, variant="subtle", ...rest}:ControlButtonProps) {

    return (
        <Button onClick={onClick} size="compact-sm" className={`${classes.button} ${className ?? ""}`} variant={variant} {...rest}>
            {children}
        </Button>
    )

}