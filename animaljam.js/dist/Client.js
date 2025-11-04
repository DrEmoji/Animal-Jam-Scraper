import { AudioRepository } from './repositories/audio/index.js';
import { AuthenticatorRepository } from './repositories/authenticator/index.js';
import { DefPackRepository } from './repositories/defpack/index.js';
import { FlashvarsRepository } from './repositories/flashvars/index.js';
import { MasterpieceRepository } from './repositories/masterpiece/index.js';
import { NetworkingRepository } from './repositories/networking/index.js';
import { ProxyRepository } from './repositories/proxy/index.js';
import { RoomRepository } from './repositories/room/index.js';
import { Request } from './request/index.js';
export class AnimalJamClient {
    request = new Request();
    audio = new AudioRepository(this);
    room = new RoomRepository(this);
    defpack = new DefPackRepository(this);
    flashvars = new FlashvarsRepository(this);
    authenticator = new AuthenticatorRepository(this);
    proxy = new ProxyRepository(this);
    masterpiece = new MasterpieceRepository(this);
    networking = NetworkingRepository;
    constructor({ deployVersion = '1678' } = {}) {
        this.request.setDeployVersion(deployVersion);
    }
}