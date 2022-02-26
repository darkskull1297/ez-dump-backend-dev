import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

export default class NamingStrategy extends DefaultNamingStrategy
  implements NamingStrategyInterface {
  eagerJoinRelationAlias(alias: string, propertyPath: string): string {
    const out = super.eagerJoinRelationAlias(alias, propertyPath);

    if (out.length > 63) {
      return `${out.slice(0, 30)}___${out.slice(-30)}`;
    }
    return out;
  }
}
