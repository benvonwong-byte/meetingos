// meeting.dearcrisis.com (Worker "dear-crisis-meeting").
//
// Since 2026-11-18 MeetingOS lives inside the Dear Crisis app, at beta.dearcrisis.com/meeting/, so it shares
// the app's sign-in and profiles (Ben: "integrate meeting.dearcrisis.com into the beta.dearcrisis.com
// ecosystem ... but it acts as an 'unlisted' link for now"). This address only forwards there, keeping the
// path, so every link already shared still opens the same page.
//
// 302, not 301: "for now". A browser never caches a 302 for good, so the address can change again later.
//
// Before this, the Worker proxied every request to meetingos-vonwong.web.app. That copy of the page could
// never see the app's sign-in, because a browser keeps it per address.
const TARGET = 'https://beta.dearcrisis.com/meeting';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    return new Response(null, {
      status: 302,
      headers: {
        location: `${TARGET}${url.pathname}${url.search}`,
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex, nofollow',
      },
    });
  },
};
