import { LifecycleState } from '../contracts/lifecycle.schema';
export declare class LifecycleStateMachine {
    private state;
    constructor(initialState?: LifecycleState);
    current(): LifecycleState;
    transition(to: LifecycleState): LifecycleState;
}
