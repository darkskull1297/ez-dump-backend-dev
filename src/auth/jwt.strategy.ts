import { Injectable, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, StrategyOptions, ExtractJwt } from "passport-jwt";
import { ConfigType } from "@nestjs/config";
import { UserRepo } from "../user/user.repository";
import { User } from "../user/user.model";
import jwtConfig from "../config/jwt.config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY) private readonly jwtConf: ConfigType<typeof jwtConfig>,
    private readonly userRepository: UserRepo,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: jwtConf.ignoreExpiration,
      secretOrKey: jwtConf.secret,
    } as StrategyOptions);
  }

  async validate({ id }: { id: string }): Promise<User> {
    return this.userRepository.findById(id);
  }
}