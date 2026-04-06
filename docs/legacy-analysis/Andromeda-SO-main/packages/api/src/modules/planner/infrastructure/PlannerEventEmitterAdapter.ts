import { IPlanEventEmitter } from "../domain/ports";
import { emitPlanEvent } from "./PlannerEventEmitter";

export class PlannerEventEmitterAdapter implements IPlanEventEmitter {
    emit(eventName: string, payload: Record<string, unknown>): void {
        emitPlanEvent(eventName, payload);
    }
}
