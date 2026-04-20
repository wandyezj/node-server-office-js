import { globalWebsocket } from "../../globalWebsocket";
import { ProtocolMessageType } from "../../../addin/ProtocolMessage";
import {
    MicroCommandAddinPing,
    MicroCommandAddinPingResult,
    MicroCommandResultError,
} from "./MicroCommand";

export async function runMicroCommandAddinPing(
    command: MicroCommandAddinPing,
): Promise<MicroCommandAddinPingResult | MicroCommandResultError> {
    const pingResult = await globalWebsocket.sendPing();

    const success = pingResult.type === ProtocolMessageType.Ping;

    let result: MicroCommandAddinPingResult | MicroCommandResultError;
    if (success) {
        result = { success };
    } else {
        result = { success: false, error: "Ping failed" };
    }

    return result;
}
