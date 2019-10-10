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
declare namespace MidiSrc {
  interface Constructor {
    /** Create new MidiDst object */
    new (name: string): MidiSrc;
    /** Create new MidiDst object */
    (name: string): MidiSrc;
  }
}
declare namespace MidiDst {
  interface Constructor {
    /** Create new MidiDst object */
    new (name: string): MidiDst;
    /** Create new MidiDst object */
    (name: string): MidiDst;
  }
}

interface WebMidiTest {
  /** MIDI enabled */
  midi: boolean;
  /** MIDI SysEx enabled */
  sysex: boolean;
  readonly MidiSrc: MidiSrc.Constructor;
  readonly MidiDst: MidiDst.Constructor;
  /** Invoke Web MIDI API */
  readonly requestMIDIAccess: (options?: WebMidi.MIDIOptions) => Promise<WebMidi.MIDIAccess>;
}
declare const wmt: WebMidiTest;

export = wmt;
