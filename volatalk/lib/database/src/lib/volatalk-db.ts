import Dexie from 'dexie';
import { IContact, IMessage, IUserProfile } from '../types/index';
const tableUser = 'userProfile';
const tableContacts = 'contacts';
const tableMessages = 'messages';

export const DB_CURRENT_VERSION = 1;

/**
 * VolaTALK Dexie Database, containing;
 *
 * 1. userProfile
 * 2. contacts
 * 3. messages
 *
 * This class defines the DB structure and executes all queries
 */
export class VolatalkDB extends Dexie {
  userProfile: Dexie.Table<IUserProfile, number>;

  contacts: Dexie.Table<IContact, string>;

  messages: Dexie.Table<IMessage, number>;

  constructor() {
    super('VolaTALK Database');
    this.version(DB_CURRENT_VERSION).stores({
      userProfile: '++id',
      contacts: 'peerid , dateTimeAccepted, dateTimeDeclined',
      messages:
        '++id, sender, receiver, dateTimeCreated, [sender+dateTimeRead], [receiver+dateTimeSent]',
    });

    this.userProfile = this.table(tableUser);
    this.contacts = this.table(tableContacts);
    this.messages = this.table(tableMessages);
  }

  /**
   *
   * @param contactid
   * @returns contact with contactid (peerid)
   */
  getContact(contactid: string) {
    return this.contacts.get(contactid);
  }

  /**
   *
   * @returns all contacts, ordered by dateTimeDeclined
   */
  async selectContacts() {
    return this.contacts.orderBy('dateTimeDeclined').toArray();
  }

  /**
   *
   * @returns a Map <peerid, Contact> for all contacts
   */
  async selectContactsMap() {
    const m = new Map<string, IContact>();
    (await this.selectContacts()).forEach((c) => m.set(c.peerid, c));
    return m;
  }
  /**
   *
   * @returns Map with Contacts with unread messages
   */
  async selectUnreadContacts() {
    const allUnreadMessages = await this.messages.where({ dateTimeRead: 0 });
    console.debug('selectUnreadContacts.allUnreadMessages ', allUnreadMessages);
    const ctcs = new Map<string, IContact>();
    for (const mes of await allUnreadMessages.toArray()) {
      //distinct contacts, maybe contacting several times, filter out
      if (!ctcs.has(mes.sender)) {
        const ctc = await this.contacts.get(mes.sender);
        ctc && ctcs.set(mes.sender, ctc);
      }
    }
    console.debug('selectUnreadContacts ', ctcs);
    return ctcs;
  }
  /**
   *
   * @param contact
   * @returns all unread messages (dateTimeRead: 0) from contact
   */
  selectUnreadMessages(contact: IContact) {
    return this.messages.where({ sender: contact.peerid, dateTimeRead: 0 });
  }
  /**
   *
   * @param contact
   * @returns ALL messages from contact.
   * TODO implement pagination, going back in time.
   */
  selectMessages(contact: IContact) {
    const contactId = contact.peerid;

    return this.messages
      .orderBy('dateTimeCreated')
      .filter((msg) => {
        return msg.sender === contactId || msg.receiver === contactId;
      })
      .toArray();

    //this where didnt work in encrypted db
    // .where('sender')
    // .equals(contactId)
    // .or('receiver')
    // .equals(contactId)
    //.sortBy('dateTimeCreated')
  }

  /**
   *
   * @param c
   * @returns messages for contact c with dateTimeSent: 0 and sorted by dateTimeCreated
   */
  selectUnsentMessages(c: IContact) {
    return this.messages.where({ receiver: c.peerid, dateTimeSent: 0 }).sortBy('dateTimeCreated');
  }

  /**
   *
   * @param contact
   * @returns the last message sent to or received from Contact
   */
  selectLastMessage(contact: IContact) {
    return this.messages
      .orderBy('dateTimeCreated')
      .filter((msg) => {
        return msg.sender === contact.peerid || msg.receiver === contact.peerid;
      })
      .last();
  }
}
