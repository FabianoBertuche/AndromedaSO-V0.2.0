import { assertTransition } from '../contracts/lifecycle.schema';
export class LifecycleStateMachine {
    constructor(initialState = 'discovered') {
        this.state = initialState;
    }
    current() {
        return this.state;
    }
    transition(to) {
        assertTransition(this.state, to);
        this.state = to;
        return this.state;
    }
}
//# sourceMappingURL=stateMachine.js.map