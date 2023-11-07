/// <reference lib="WebWorker" />
declare const self: ServiceWorkerGlobalScope;


async function showNotification(
	playlistItem: any,
	video: any,
) {
	await self.registration.showNotification(video.snippet.title ?? '', {
		body: `A new video was added to '${playlistItem.snippet.title}'`,
		icon: video.snippet.thumbnails.high.url,
		tag: `https://youtu.be/${video.snippet.resourceId.videoId}`,
	});
}

export async function checkForUpdates() {
	const newVideos: never[] = [];
	for (const {playlistItem, video} of newVideos) {
		await showNotification(playlistItem, video);
	}
}
