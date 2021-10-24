import { /* inject, */ BindingScope, injectable} from '@loopback/core';
import {Configuracion} from '../keys/configuracion';
import {NotificacionCorreo} from '../models';
const fetch = require('node-fetch');

@injectable({scope: BindingScope.TRANSIENT})
export class NotificacionesService {
  constructor(/* Add @inject to inject parameters */) { }

  /*
   * Add service methods here
   */
  enviarCorreo(datos: NotificacionCorreo) {
    let urlCorreo = `${Configuracion.urlCorreo}?${Configuracion.hashArg}=${Configuracion.hashNotificacion}&${Configuracion.destinoArg}=${datos.destino}&${Configuracion.asuntoArg}=${datos.asunto}&${Configuracion.mensajeArg}=${datos.mensaje}`;
    console.log(`${Configuracion.urlCorreo}`);
    console.log(`${Configuracion.hashArg}`);
    console.log(`${Configuracion.hashNotificacion}`);
    fetch(urlCorreo)
      .then((resp: any) => {
        console.log(resp.text());
        //return resp.text() == Configuracion.respuesta;
      })
  }

  /* async enviarCorreo(datos: NotificacionCorreo) {
    let urlCorreo = `${Configuracion.urlCorreo}
                    ?${Configuracion.destinoArg}=${datos.destino}
                    &${Configuracion.asuntoArg}=${datos.asunto}
                    &${Configuracion.mensajeArg}=${datos.mensaje}
                    &${Configuracion.hashArg}=${Configuracion.hashNotificacion}`;
    await fetch(urlCorreo)
      .then((resp: any) => {
        console.log(resp.text());
        //return resp.text() == Configuracion.respuesta;
      })
  } */
}
