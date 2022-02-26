import { BaseModel } from '../common/base.model';

export function getKeyMap<T extends BaseModel>(list: T[]): Record<string, T> {
  const map = {};
  list.forEach(item => {
    map[item.id] = item;
  });
  return map;
}
