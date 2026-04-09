class NamedTiming {
    constructor() {
        this.tracks = [];
        this.startTime = 0;
        this.running = false;
        this.offset = 1106;
    }

    getInfo() {
        return {
            id: 'namedtiming',
            name: 'Named Timing',
            blocks: [
                {
                    opcode: 'pasteList',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'paste timestamps [TEXT] into list [NAME]',
                    arguments: {
                        TEXT: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: '1000\n2000\n3000'
                        },
                        NAME: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'stamp1'
                        }
                    }
                },
                {
                    opcode: 'clearList',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'clear list [NAME]',
                    arguments: {
                        NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'stamp1' }
                    }
                },
                {
                    opcode: 'loadList',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'load list [NAME] into track [ID]',
                    arguments: {
                        NAME: { type: Scratch.ArgumentType.STRING, defaultValue: 'stamp1' },
                        ID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 }
                    }
                },
                {
                    opcode: 'setOffset',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'set spawn offset (ms) [MS]',
                    arguments: {
                        MS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1106 }
                    }
                },
                {
                    opcode: 'start',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'start'
                }
            ]
        };
    }

    // 🔍 Liste finden (Sprite ODER Stage)
    getList(name, util) {
        let list = util.target.lookupVariableByNameAndType(name, "list");

        if (!list) {
            const stage = Scratch.vm.runtime.getTargetForStage();
            list = stage.lookupVariableByNameAndType(name, "list");
        }

        return list;
    }

    // 📥 TEXT → LISTE
    pasteList(args, util) {
        const list = this.getList(args.NAME, util);
        if (!list) {
            console.warn("Liste nicht gefunden:", args.NAME);
            return;
        }

        list.value = [];

        const lines = args.TEXT.split(/\s+/);

        for (let line of lines) {
            const num = Number(line.trim());
            if (!isNaN(num)) {
                list.value.push(num);
            }
        }
    }

    // 🧹 Liste leeren
    clearList(args, util) {
        const list = this.getList(args.NAME, util);
        if (!list) return;
        list.value = [];
    }

    // 📦 Track laden
    loadList(args, util) {
        const list = this.getList(args.NAME, util);
        if (!list) {
            console.warn("Liste nicht gefunden:", args.NAME);
            return;
        }

        this.tracks[args.ID] = {
            times: list.value.map(Number),
            index: 0
        };
    }

    // ⏱ Offset setzen
    setOffset(args) {
        this.offset = args.MS;
    }

    // ▶️ Start
    start() {
        this.startTime = performance.now();
        this.running = true;

        // Reset indices
        this.tracks.forEach(track => {
            if (track) track.index = 0;
        });

        this.loop();
    }

    // 🔁 Loop
    loop() {
        if (!this.running) return;

        // 🛑 STOP BUTTON FIX
        if (!Scratch.vm.runtime.isRunning()) {
            this.running = false;
            return;
        }

        const now = performance.now() - this.startTime;

        this.tracks.forEach((track, i) => {
            if (!track) return;

            while (
                track.index < track.times.length &&
                now >= track.times[track.index] - this.offset
            ) {
                this.spawn(i);
                track.index++;
            }
        });

        requestAnimationFrame(() => this.loop());
    }

    // 📡 Broadcast
    spawn(id) {
        // Debug:
        // console.log("SPAWN TRACK:", id);

        Scratch.vm.runtime.startHats('event_whenbroadcastreceived', {
            BROADCAST_OPTION: 'spawn_' + id
        });
    }
}

Scratch.extensions.register(new NamedTiming());
