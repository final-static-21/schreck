import React, { useEffect, useState } from 'react';
import { Text, View, SafeAreaView, StyleSheet, Image } from 'react-native';
import { Appbar, Avatar, Switch, Divider, ActivityIndicator, Button, TextInput } from 'react-native-paper';
import { SchreckCredentials, loadCredentials, storeCredentials, deleteCredentials } from './SecureStorage';

type Props = {

}

let timeout: any = null;

export default function MainPage( props: Props ) {


  const [user, setUser] = useState<string|null>(null);
  const [pwd, setPwd] = useState<string|null>(null);
  const [url, setUrl] = useState<string|null>(null);

  const [apiSession, setApiSession] = useState<string|null>(null);
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  
  const [schreckStatus, setSchreckStatus] = useState<boolean|null>(null);

  const [lastStatus, setLastStatus] = useState<string>("nie");


  useEffect( handleMount, []);

  useEffect( () => {
    clearTimeout( timeout );
    if( apiSession ) {
      pollCcu();
    }
  }, [apiSession]);

  useEffect( () => {
    setIsSwitchOn( schreckStatus ? schreckStatus : false );
  }, [schreckStatus]);

  function apiCall( method: string, params: any ) {
    if( !url ) {
      return Promise.reject("Fehler: Url ist leer!");
    }
    
    return fetch( url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "1.1", 
        method: method,
        params: params
      })
    })
    .then((response) => response.json());

  }

  function updateCcuStatus() {

    apiCall("SysVar.getValueByName", {"_session_id_": apiSession, "name": "Einbrecherschreck"})
    .then( r => {
      setSchreckStatus( parseBoolean( r ) );
      setIsSwitchOn( parseBooleanFlag( r ) );
    })
    .catch(e => alert(e));

  } 

  function parseBoolean( value: string|null ): boolean|null {
    if( value === "true" ) {
      return true;
    }
    if( value === "false" ) {
      return false;
    }
    return null;
  }

  function parseBooleanFlag( value: string|null ): boolean {
    if( value === "true" ) {
      return true;
    }
    return false;
  }

  function handleLogin() {
    storeCredentials({
      user: user,
      pwd: pwd,
      url: url
    })
    .then(() => {
      return apiCall( "Session.login", {
        username: user, 
        password: pwd
      })
    })
    .then( (response: any) => {
      setApiSession( response.result );
    })
    .catch( ( e: any ) => {
      alert("Fehler: " + e );
      setApiSession( null );
    });
  }

  function handleLogout() {
    if( !apiSession ) {
      return;
    }

    apiCall( "Session.logout", {
        "_session_id_": apiSession
    })
    .then( () => {
      setApiSession( null );
    })
    .catch( ( e: any ) => {
      alert("Fehler: " + e );
      setApiSession( null );
    });

    
  }

  function handleReset() {
    deleteCredentials()
      .then( () => {
        setUser( null );
        setPwd( null );
        setUrl( null );
      })
      .catch( ( e: any ) => alert("Fehler: " + e ) );
  }


  function handleMount() {
    loadCredentials()
      .then( ( cred: SchreckCredentials ) => {
        setUrl( cred.url );
        setUser( cred.user );
        setPwd( cred.pwd );
      })
      .catch((e: any) => alert('Fehler: ' + e ) );

    return () => handleUnmount();
  }

  function pollCcu() {
    
    if( !apiSession ) {
      return;
    }

    // alert("pol");

    apiCall( "SysVar.getValueByName", {
        "_session_id_": apiSession,
        "name": "Einbrecherschreck"
    })
    .then( ( response ) => {
      if( response.error != null ) {
        setSchreckStatus( null );
        clearTimeout( timeout );
        if( response.error.code === 400 ) {
          alert("Zu lange untätig, bitte erneut einloggen!");
          setApiSession( null );
        }
        else {
          Promise.reject( response.error.message );
        }
      }
      else {
        setSchreckStatus( parseBoolean( response.result ) );
        setLastStatus( (new Date()).toLocaleString() );
        timeout = setTimeout( pollCcu, 5000 );
      }
    })
    .catch( ( e: any ) => {
      alert("Fehler: " + e );
      clearTimeout( timeout );
      setApiSession( null );
    });
  }

  function handleUnmount() {
    handleLogout();
  }

  function onSwitchChange( value: boolean ) {
    const newVal = !isSwitchOn;
    setIsSwitchOn( newVal )
    apiCall( "SysVar.setBool", {
        "_session_id_": apiSession,
        "name": "Einbrecherschreck",
        "value": newVal ? 1 : 0
    });
  }

  return (
    <View>
      <Appbar.Header>
        <Avatar.Image size={50} source={require('../assets/einbrecher80.png')} style={{marginLeft: 5, marginBottom: 2}}/>
        <Appbar.Content title="Schreck" />
      </Appbar.Header>

      <View>

      {!!apiSession && (
        <View style={{ margin: 20}} >

          <View style={{marginTop: 20, flexDirection: "row"}} >
            <View style={{ flex: 0.8 }}>
              <Text>Schreck</Text>
            </View>
            <View style={{ flex: 0.2 }}>
              <Switch value={isSwitchOn} onValueChange={onSwitchChange} />
            </View>
          </View>
          
          <View style={{marginTop: 20}}>
            <Divider/>
          </View>

          <View style={{marginTop: 20}}>
            <Text style={{fontSize: 20}}>
              Session: {apiSession}
            </Text>
            <Text style={{fontSize: 20}}>
              Schreck: {schreckStatus !== null ? ( schreckStatus ? 'an' : 'aus' ) : 'unbekannt'}
            </Text>
            <Text style={{fontSize: 20}}>
              Aktualisiert: {lastStatus}
            </Text>
          </View>
          
          <View style={{marginTop: 20}}>
            <Divider/>
          </View>
          
          <Button style={{marginTop: 15, width: "60%"}} mode="contained" onPress={handleLogout}>
            Logout
          </Button>
        </View>
      )}


      {!apiSession && (
        <View style={{ margin: 20}} >
          <TextInput style={{marginTop: 5}} mode="outlined" autoCompleteType="off" autoCapitalize = "none"
            label="Nutzer" value={user} onChangeText={setUser} />
          <TextInput style={{marginTop: 5}} mode="outlined" autoCompleteType="off" autoCapitalize = "none"
            secureTextEntry={true}
            label="Passwort" value={pwd} onChangeText={setPwd} />
          <TextInput style={{marginTop: 5}} mode="outlined" autoCompleteType="off" autoCapitalize = "none"
            label="URL" value={url} onChangeText={setUrl} />
          <Button style={{marginTop: 15, width: "60%"}} mode="contained" onPress={handleLogin}>
            Login
          </Button>
        </View>
      )}

      </View>
       

    </View>
  );

}

