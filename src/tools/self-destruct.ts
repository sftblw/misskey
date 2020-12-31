import loadConfig from '../config/load';
import {initDb} from '../db/postgre';
import {getConnection} from 'typeorm';

function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function connect_db() {
	loadConfig();
	console.log('Connecting...');
	await initDb();
	const v = await getConnection().query('SHOW server_version').then(x => x[0].server_version);
	console.log(`Connected: v${v}`);
}

async function main() {
	await connect_db();

	// eslint-disable-next-line no-undef
	const models = require('../models');
	const Notes = models.Notes;
	const Users = models.Users;

	// eslint-disable-next-line no-undef
	const deleteNote = require('../services/note/delete');

	console.log('removing notes');

	async function delete_notes() {
		console.log('removing notes');

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const condition = { uri: null };
			const allNotes10 = await Notes.find({take: 1, where: condition});
			const count = await Notes.count({where: condition});
			console.log(`remaining notes: ${count}`);

			if (allNotes10.length == 0) { break; }

			for (const note of allNotes10) {
				const user = await Users.findOne({ id: note.userId });
				if (user == null) { continue; }
				// dry-run
				// console.log(`user: ${user.username}, note: ${note.id}, ${note.text}`);
				await deleteNote.default(user, note);
			}
			await sleep(5000);
		}
	}

	await delete_notes();

	// eslint-disable-next-line no-undef
	const SuspendUser = require('../services/suspend-user');

	async function delete_users() {
		console.log('removing users');

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const condition = { host: null, isAdmin: false };
			const allUsers10 = await Users.find({take: 3, where: condition});
			const count = await Users.count({where: condition});
			console.log(`remaining users: ${count}`);

			if (allUsers10.length == 0) { break; }

			for (const user of allUsers10) {
				// dry-run
				// console.log(`user: ${user.username}`);

				// 物理削除する前にDelete activityを送信する
				await SuspendUser.doPostSuspend(user).catch(e => {});
				await Users.delete(user.id);
			}
			await sleep(5000);
		}
	}

	await delete_users();

	// eslint-disable-next-line no-undef
	const readline = require('readline');
	console.log('will delete admins. press any key');
	readline();

	async function delete_admins() {
		console.log('removing admins');

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const condition = { host: null, isAdmin: true };
			const allUsers10 = await Users.find({take: 1, where: condition});
			const count = await Users.count({where: condition});
			console.log(`remaining admins: ${count}`);

			if (allUsers10.length == 0) { break; }

			for (const user of allUsers10) {
				// dry-run
				// console.log(`user: ${user.username}`);

				// 物理削除する前にDelete activityを送信する
				await SuspendUser.doPostSuspend(user).catch(e => {});
				await Users.delete(user.id);
			}
			await sleep(5000);
		}
	}

	await delete_admins();

	console.log('done');
}

main().then(() => {
	console.log('Success');
	process.exit(0);
}).catch(e => {
	console.error(`Error: ${e.message || e}`);
	process.exit(1);
});
