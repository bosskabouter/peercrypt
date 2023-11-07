import 'fake-indexeddb/auto';

import { VolatalkDB, DB_CURRENT_VERSION } from './volatalk-db';

import { IContact } from '../types';

describe('volatalkDb', () => {
  it('should work', () => {
    expect(new VolatalkDB().verno).toEqual(DB_CURRENT_VERSION);
  });
});

describe('Database tests', () => {
  let db: VolatalkDB;

  beforeAll(() => {
    db = new VolatalkDB();
    expect(aContact).toBeDefined();
  });

  test('should insert aContact', async () => {
    db = new VolatalkDB();
    const key = await db.contacts.add(aContact);
    expect(key).toBeDefined();
  });
});
export const aContact: IContact = {
  signature: '123',
  dateTimeCreated: 0,
  dateTimeAccepted: 0,
  dateTimeDeclined: 0,
  dateTimeResponded: 0,
  peerid: '4241sdsfs-34',
  dateRegistered: new Date(),
  nickname: 'test',
  avatar: 'rgrg',
  avatarThumb: 'rgrg',
  position: null,
  pushSubscription: null,
  favorite: false,
};
