export function SingletonDecorator<T extends { new(...args: any[]): {} }>(target: T): T {
  let instance: any;

  return class extends target {
    constructor(...args: any[]) {
      if (instance) {
        return instance;
      }
      super(...args);
      instance = this;
    }
  };
}
