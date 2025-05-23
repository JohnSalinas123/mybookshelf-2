import { Divider, DividerProps} from "@mantine/core"

interface ControlDividerProps extends DividerProps {

}

export function ControlDivider ({className}:ControlDividerProps) {

    return (
        <Divider size="sm" orientation="vertical" h="80%" color={"var(--v-divider)"} className={`${className ?? ""}`} 
        style={{"alignSelf": "center"}}/>
    )

}