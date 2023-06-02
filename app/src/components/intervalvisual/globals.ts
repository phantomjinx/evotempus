import { HierarchyRectangularNode } from 'd3-hierarchy';
import { Interval } from 'src/types';

export const svgId = 'interval-visual-component-svg';

export const ELLIPSIS = '...';
export const TEXT_LENGTH = 7;
export const clickDelay: number = 200;

export class Dimensions {
  public x0: number = 0;
  public y0: number = 0;
  public x1: number = 0;
  public y1: number = 0;

  constructor({x0 = 0, x1 = 0, y0 = 0, y1 = 0}) {
    this.x0 = x0;
    this.x1 = x1;
    this.y0 = y0;
    this.y1 = y1;
  }

  protected interpolateValue(current: number, target: number, step: number, exclusiveMax: number): number {
    /*
     * As the max is exclusive, we need to substract 1 from it
     * to ensure the interpolate value is correctly evaluated
     */
    const stepsLeft = (exclusiveMax - 1) - step;

    // If they match then no more work to be done, regardless of steps left
    if (current === target) return target;

    // Finds the difference, which can be -ve or +ve
    const diff = target - current;
    // Calculate the proportion of the remaining difference using the steps left
    const increment = stepsLeft > 0 ? (diff / stepsLeft) : diff;

    // Return the new value of current with added/subtracted extra work
    return current + increment;
  }

  /*
   * Begin to interpolate this dimension to the target dimension
   * taking into account the step of the interpolation and the exclusive
   * maximum of the steps
   */
  interpolate(target: Dimensions, step: number, exclusiveMax: number): Dimensions {
    const v = Object.assign(this);
    v.x0 = this.interpolateValue(this.x0, target.x0, step, exclusiveMax);
    v.x1 = this.interpolateValue(this.x1, target.x1, step, exclusiveMax);
    v.y0 = this.interpolateValue(this.y0, target.y0, step, exclusiveMax);
    v.y1 = this.interpolateValue(this.y1, target.y1, step, exclusiveMax);
    return v;
  }
}

export interface ZoomSystem {
  viewPort: number,
  ox: number,
  oy: number,
}

/**
 * Alias for the type of d3 node created by the partition function
 */
export type ViewNode = HierarchyRectangularNode<ViewInterval>;

/**
 * Interval decorated with additional view properties
 */
export class ViewInterval {
  private interval: Interval;

  visible: boolean = false;
  wasVisible: boolean = false;
  current: Dimensions | null;
  target: Dimensions | null;
  selected: boolean = false;
  markers?: Record<string, string|number>;

  constructor(interval: Interval) {
    this.interval = interval;
    this.current = null;
    this.target = null;
  }

  /**
   * Don't expose the interval as it encourages mistakes
   * Instead allow direct access through a callback function
   */
  call(callback: (interval: Interval) => void) {
    callback(this.interval);
  }

  id(): string {
    return this.interval._id;
  }

  name(): string {
    return this.interval.name;
  }

  parent(): string {
    return this.interval.parent;
  }

  to(): number {
    return this.interval.to;
  }

  from(): number {
    return this.interval.from;
  }

  progeny(): number {
    return this.interval.children.length;
  }

  owner(): string | number | null {
    return this.marker('owner');
  }

  setOwner(value: string|number) {
    this.addMarker('owner', value);
  }

  marker(key: string): string | number | null {
    if (! this.markers)
      return null;

    return this.markers[key];
  }

  addMarker(key: string, value: string|number) {
    if (! this.markers)
      this.markers = {};

    this.markers[key] = value;
  }
}
