/** A user record from the Express API's MongoDB `users` collection. */
export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
