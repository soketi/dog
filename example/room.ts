import { Shard } from '$lib/index';
import type { Socket } from '$lib/index';
import type { Bindings } from './types';

export class Room extends Shard<Bindings> {
	onconnect() {
		console.log('user has joined');
	}

	link(env: Bindings) {
		return env.LOBBY;
	}

	async receive(req: Request) {
		console.log('[ HELLO ][receive] req.url', req.url);

		let { pathname } = new URL(req.url);
		if (pathname === '/ws') return this.connect(req);

		return new Response(`PATH: "${pathname}"`);
	}

	onopen(socket: Socket) {
		console.log('[ HELLO ][onopen]');

		socket.emit({
			type: 'join',
			uid: socket.uid,
		});
	}

	onclose(socket: Socket) {
		console.log('[ HELLO ][onclose]');

		socket.emit({
			type: 'exit',
			uid: socket.uid,
		});
	}

	onmessage(socket: Socket, data: string) {
		// raw broadcast channel
		let input = JSON.parse(data);
		console.log('[room] onmessage', input);
		input.uid = input.uid || socket.uid;

		if (input.type === 'whoami') {
			socket.send(JSON.stringify(input));
		} else {
			socket.emit(input);
		}

		// try {
		// 	let input = JSON.parse(data);
		// 	console.log({ input });
		// 	if (input.value < 10) {
		// 		console.log('i am here', input.value);
		// 		socket.emit({
		// 			uid: socket.uid,
		// 			value: input.value + 1
		// 		});
		// 	} else {
		// 		console.log('~> DONE');
		// 	}
		// } catch (err) {
		// 	console.log('[ HELLO ][onmessage]', socket.uid, { data });
		// }
	}
}
