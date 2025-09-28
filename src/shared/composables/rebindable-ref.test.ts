/**
 * RebindableRef 测试文件
 */

import { ref } from 'vue';
import { RebindableRef } from './rebindable-ref';

describe('RebindableRef', () => {
  it('should create with initial value', () => {
    const rebindableRef = new RebindableRef('initial');
    expect(rebindableRef.value).toBe('initial');
  });

  it('should update value', () => {
    const rebindableRef = new RebindableRef('initial');
    rebindableRef.value = 'updated';
    expect(rebindableRef.value).toBe('updated');
  });

  it('should rebind to new source', () => {
    const source = ref('source value');
    const rebindableRef = new RebindableRef('initial');
    
    rebindableRef.rebind(source);
    expect(rebindableRef.value).toBe('source value');
    
    source.value = 'new source value';
    expect(rebindableRef.value).toBe('new source value');
  });

  it('should unbind from source', () => {
    const source = ref('source value');
    const rebindableRef = new RebindableRef('initial');
    
    rebindableRef.rebind(source);
    rebindableRef.unbind();
    
    rebindableRef.value = 'new value';
    expect(source.value).toBe('source value'); // 应该不会同步
  });

  it('should dispose properly', () => {
    const source = ref('source value');
    const rebindableRef = new RebindableRef('initial');
    
    rebindableRef.rebind(source);
    rebindableRef.dispose();
    
    rebindableRef.value = 'new value';
    expect(source.value).toBe('source value'); // 应该不会同步
  });
});
