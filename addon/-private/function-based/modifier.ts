import { setModifierManager } from '@ember/modifier';
import Opaque from '../opaque';
import {
  ElementFor,
  EmptyObject,
  NamedArgs,
  PositionalArgs,
} from '../signature';
import FunctionBasedModifierManager from './modifier-manager';

// Provide a singleton manager.
const MANAGER = new FunctionBasedModifierManager();

// This provides a signature whose only purpose here is to represent the runtime
// type of a function-based modifier: an opaque item. The fact that it's an
// empty interface is actually the point: it *only* hooks the type parameter
// into the opaque (nominal) type.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface FunctionBasedModifier<S> extends Opaque<S> {}

/**
 * The (optional) return type for a modifier which needs to perform some kind of
 * cleanup or teardown -- for example, removing an event listener from an
 * element besides the one passed into the modifier.
 */
export type Teardown = () => unknown;

/**
 * An API for writing simple modifiers.
 *
 * This function runs the first time when the element the modifier was applied
 * to is inserted into the DOM, and it *autotracks* while running. Any values
 * that it accesses will be tracked, including any of its arguments that it
 * accesses, and if any of them changes, the function will run again.
 *
 * **Note:** this will *not* automatically rerun because an argument changes. It
 * will only rerun if it is *using* that argument (the same as with auto-tracked
 * state in general).
 *
 * The modifier can also optionally return a *destructor*. The destructor
 * function will be run just before the next update, and when the element is
 * being removed entirely. It should generally clean up the changes that the
 * modifier made in the first place.
 *
 * @param fn The function which defines the modifier.
 */
// This overload allows users to write types directly on the callback passed to
// the `modifier` function and infer the resulting type correctly.
export default function modifier<
  E extends Element,
  P extends unknown[],
  N = EmptyObject
>(
  fn: (element: E, positional: P, named: N) => void | Teardown
): FunctionBasedModifier<{
  Args: {
    Positional: P;
    Named: N;
  };
  Element: E;
}>;

/**
 * An API for writing simple modifiers.
 *
 * This function runs the first time when the element the modifier was applied
 * to is inserted into the DOM, and it *autotracks* while running. Any values
 * that it accesses will be tracked, including any of its arguments that it
 * accesses, and if any of them changes, the function will run again.
 *
 * **Note:** this will *not* automatically rerun because an argument changes. It
 * will only rerun if it is *using* that argument (the same as with auto-tracked
 * state in general).
 *
 * The modifier can also optionally return a *destructor*. The destructor
 * function will be run just before the next update, and when the element is
 * being removed entirely. It should generally clean up the changes that the
 * modifier made in the first place.
 *
 * @param fn The function which defines the modifier.
 */
// This overload allows users to provide a `Signature` type explicitly at the
// modifier definition site, e.g. `modifier<Sig>((el, pos, named) => {...})`.
// **Note:** this overload must appear second, since TS' inference engine will
// not correctly infer the type of `S` here from the types on the supplied
// callback.
export default function modifier<S>(
  fn: (
    element: ElementFor<S>,
    positional: PositionalArgs<S>,
    named: NamedArgs<S>
  ) => void | Teardown
): FunctionBasedModifier<{
  Element: ElementFor<S>;
  Args: {
    Named: NamedArgs<S>;
    Positional: PositionalArgs<S>;
  };
}>;

// This is the runtime signature; it performs no inference whatsover and just
// uses the simplest version of the invocation possible since, for the case of
// setting it on the modifier manager, we don't *need* any of that info, and
// the two previous overloads capture all invocations from a type perspective.
export default function modifier(
  fn: (
    element: Element,
    positional: unknown[],
    named: object
  ) => void | Teardown
): FunctionBasedModifier<{
  Element: Element;
  Args: {
    Named: object;
    Positional: unknown[];
  };
}> {
  // SAFETY: the cast here is a *lie*, but it is a useful one. The actual return
  // type of `setModifierManager` today is `void`; we pretend it actually
  // returns an opaque `Modifier` type so that we can provide a result from this
  // type which is useful to TS-aware tooling (e.g. Glint).
  return setModifierManager(
    () => MANAGER,
    fn
  ) as unknown as FunctionBasedModifier<{
    Element: Element;
    Args: {
      Named: object;
      Positional: unknown[];
    };
  }>;
}

/**
 * @internal
 */
export type FunctionBasedModifierDefinition<S> = (
  element: ElementFor<S>,
  positional: PositionalArgs<S>,
  named: NamedArgs<S>
) => void | Teardown;
