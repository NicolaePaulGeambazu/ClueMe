export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
}

export type RootStackParamList = {
  Home: undefined;
  Reminders: undefined;
  Calendar: undefined;
  Lists: undefined;
  Settings: undefined;
  AddReminder: undefined;
  EditReminder: { reminderId: string };
  ListDetail: { listId: string };
  Family: undefined;
  Search: undefined;
  Trash: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};
