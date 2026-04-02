import { assertTransition, LifecycleState } from '../contracts/lifecycle.schema';

export class LifecycleStateMachine {
  private state: LifecycleState;

  constructor(initialState: LifecycleState = 'discovered') {
    this.state = initialState;
  }

  current(): LifecycleState {
    return this.state;
  }

  transition(to: LifecycleState): LifecycleState {
    assertTransition(this.state, to);
    this.state = to;
    return this.state;
  }
}
