/* eslint-env jest */
// Mock Three.js classes for testing
export const Vector3 = class {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  copy(v) { 
    this.x = v.x; 
    this.y = v.y; 
    this.z = v.z; 
    return this;
  }
  clone() { return new Vector3(this.x, this.y, this.z); }
  equals(v) { 
    return this.x === v.x && this.y === v.y && this.z === v.z; 
  }
};

export const Color = jest.fn();
export const ShaderMaterial = jest.fn();
export const BufferAttribute = jest.fn();
export const AdditiveBlending = 'additive';
export const BackSide = 'back';
export const Mesh = jest.fn();
export const Points = jest.fn();
