import throttle from "./common/throttle"
import { makePersistedNamespaced } from "./storage"
import { createContext, useContext } from "solid-js"

type Name = string
type Path = string

class Player {

    ctx = makeAudioContext()
    sounds = new Map<Path, Sound>()
    paths = new Map<Name, Path>()

    theme = 'standard'

    volumeStorage = makePersistedNamespaced('1', '.sound.volume')

    enabled = () => this.theme !== 'silent'

    resolvePath(name: Name): string | undefined {
        if (!this.enabled()) return;
        let dir = this.theme
        return `sound/${dir}/${name[0].toUpperCase() + name.slice(1)}`
    }

    getVolume = (): number => {
        const v = parseFloat(this.volumeStorage[0]())
        return v >= 0 ? v : 0.7
    }

  async play(name: Name, volume = 1): Promise<void> {
    if (!this.enabled()) return;
    const sound = await this.load(name);
    if (sound) await sound.play(this.getVolume() * volume);
  }

  async load(name: Name, path?: Path): Promise<Sound | undefined> {
    if (!this.ctx) return;
    if (path) this.paths.set(name, path);
    else path = this.paths.get(name) ?? this.resolvePath(name);
    if (!path) return;
    if (this.sounds.has(path)) return this.sounds.get(path);

    console.log(path)
    const result = await fetch(`${path}.mp3`);
    if (!result.ok) throw new Error(`${path}.mp3 failed ${result.status}`);

    const arrayBuffer = await result.arrayBuffer();
    const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
      if (this.ctx?.decodeAudioData.length === 1)
        this.ctx?.decodeAudioData(arrayBuffer).then(resolve).catch(reject);
      else this.ctx?.decodeAudioData(arrayBuffer, resolve, reject);
    });
    const sound = new Sound(this.ctx, audioBuffer);
    this.sounds.set(path, sound);
    return sound;
  }



    preloadBoardSounds() {
        for (const name of ['move', 'capture', 'check', 'genericNotify']) this.load(name);
    }

    throttled = throttle(200, (name: Name) => this.play(name))

    setVolume = (v: number) => this.volumeStorage[1](v.toString())

    async move(o?: { uci?: string; san?: string; name?: Name }) {
        if (o?.name) this.throttled(o.name);
        else {
            if (o?.san?.includes('x')) this.throttled('capture');
            else this.throttled('move');
            if (o?.san?.includes('#') || o?.san?.includes('+')) this.throttled('check');
        }
    }
}

class Sound {
  node!: GainNode;
  ctx!: AudioContext;

  constructor(
    ctx: AudioContext,
    readonly buffer: AudioBuffer,
  ) {
    this.rewire(ctx);
  }

  play(volume = 1): Promise<void> {
    this.node.gain.setValueAtTime(volume, this.ctx!.currentTime);
    const source = this.ctx!.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.node);
    return new Promise<void>(resolve => {
      source.onended = () => {
        source.disconnect();
        resolve();
      };
      source.start(0);
    });
  }
  rewire(ctx: AudioContext) {
    this.node?.disconnect();
    this.ctx = ctx;
    this.node = this.ctx.createGain();
    this.node.connect(this.ctx.destination);
  }
}

function makeAudioContext(): AudioContext | undefined {
  return new AudioContext()
}

const PlayerContext = createContext<Player>(new Player())

export function PlayerProvider(props: any) {
    return (
      <PlayerContext.Provider value={new Player()}>
        {props.children}
      </PlayerContext.Provider>
    )
}

export function usePlayer() { return useContext<Player>(PlayerContext) }

