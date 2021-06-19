import * as SecureStore from 'expo-secure-store';

export type SchreckCredentials = {
  user: string|null;
  pwd: string|null;
  url: string|null;
}

const KEYCHAIN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: "kSecAttrService",
  keychainAccessible: SecureStore.WHEN_UNLOCKED
};

export function loadCredentials(): Promise<SchreckCredentials> {
  return SecureStore.getItemAsync("schreck_credentials",KEYCHAIN_OPTIONS)
    .then( ( v: any ) => {
      return v 
        ? JSON.parse(v) as SchreckCredentials 
        : { user: null, pwd: null, url: null };
    });
}

export function storeCredentials( cred: SchreckCredentials): Promise<any> {
  return SecureStore.setItemAsync("schreck_credentials",JSON.stringify(cred),KEYCHAIN_OPTIONS);
}

export function deleteCredentials(): Promise<any> {
  return SecureStore.deleteItemAsync("schreck_credentials",KEYCHAIN_OPTIONS);
}
