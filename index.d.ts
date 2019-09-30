import 'webmidi';

/** MIDI Source -- a virtual MIDI-In port */
interface MidiSrc {
  /** Port name */
  readonly name: string;
  /** Connect the port */
  readonly connect: () => boolean;
  /** Disconnect the port */
  readonly disconnect: () => boolean;
  /** Emit MIDI message */
  readonly emit: (message: number[]) => void;
  /** Port is busy */
  busy: boolean;
}

/** MIDI Destination -- a virtual MIDI-Out port */
interface MidiDst {
  /** Port name */
  readonly name: string;
  /** Connect the port */
  readonly connect: () => boolean;
  /** Disconnect the port */
  readonly disconnect: () => boolean;
  /** User-defined MIDI message handler */
  receive: (message?: number[]) => void;
  /** Port is busy */
  busy: boolean;
}

interface MidiSrcConstructor {
  /** Create new MidiSrc object */
  new (name: string): MidiSrc;
  /** Create new MidiSrc object */
  (name: string): MidiSrc;
}

interface MidiDstConstructor {
  /** Create new MidiDst object */
  new (name: string): MidiDst;
  /** Create new MidiDst object */
  (name: string): MidiDst;
}

interface WMT {
  /** MIDI enabled */
  midi: boolean;
  /** MIDI SysEx enabled */
  sysex: boolean;
  readonly MidiSrc: MidiSrcConstructor;
  readonly MidiDst: MidiDstConstructor;
  /** Invoke Web MIDI API */
  readonly requestMIDIAccess: (options?: WebMidi.MIDIOptions) => Promise<WebMidi.MIDIAccess>;
}
declare const wmt: WMT;

export = wmt;
