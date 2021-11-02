import {service} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where
} from '@loopback/repository';
import {
  del, get,
  getModelSchemaRef, param, patch, post, put, requestBody,
  response
} from '@loopback/rest';
import {Configuracion} from '../keys/configuracion';
import {CambioClave, Credenciales, Usuario} from '../models';
import {CredencialesRecuperarClave} from '../models/credenciales-recuperar-clave.model';
import {NotificacionCorreo} from '../models/notificacion-correo.model';
import {UsuarioRepository} from '../repositories';
import {AdmiDeClavesService} from '../services';
import {NotificacionesService} from '../services/notificaciones.service';

export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    @service(AdmiDeClavesService)
    public adminDeClavesService: AdmiDeClavesService,
    @service(NotificacionesService)
    public notiService: NotificacionesService
  ) { }

  ////////////// CREAR USUARIO ///////////////////////////////////////////


  @post('/usuarios')
  @response(200, {
    description: 'Usuario model instance',
    content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {
            title: 'NewUsuario',
            exclude: ['id'],
          }),
        },
      },
    })
    usuario: Omit<Usuario, 'id'>,
  ): Promise<Usuario | boolean | string> {
    let clave = this.adminDeClavesService.crearClaveAleatoria();
    //console.log(clave);
    // Enviar clave por correo electronico
    let claveCifrada = this.adminDeClavesService.cifrarTexto(clave);
    //console.log(claveCifrada);
    usuario.contrasenia = claveCifrada;
    let usuarioVerificado = await this.usuarioRepository.findOne({
      where: {
        correo: usuario.correo
      }
    })
    if (!usuarioVerificado) {
      let usuarioCreado = await this.usuarioRepository.create(usuario);
      if (usuarioCreado) {
        // enviar clave por correo electronico
        let datos = new NotificacionCorreo();
        datos.destino = usuarioCreado.correo;
        datos.asunto = Configuracion.asuntoUsuarioCreado;
        datos.mensaje = `${Configuracion.saludo}
                       ${usuarioCreado.nombre}<br>
                       ${Configuracion.mensajeUsuarioCreado}
                       ${Configuracion.mensajeUsuarioCreadoClave}
                       ${clave}`
        this.notiService.enviarCorreo(datos);
        return true
      }
      return usuarioCreado;
    }
    return "el correo ya existe";
  }

  /**
   * Metodos adicionales a los generados por loopback
   */

  @post('/identificar-usuario')
  @response(200, {
    description: 'Identificacion de usuarios',
    content: {'application/json': {schema: getModelSchemaRef(Credenciales)}},
  })
  async identificarUsuario(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Credenciales, {
            title: 'Identificar usuario'
          }),
        },
      },
    })
    credenciales: Credenciales,
  ): Promise<object | null> {
    let usuario = await this.usuarioRepository.findOne({
      where: {
        correo: credenciales.usuario,
        contrasenia: credenciales.clave
      }
    });
    if (usuario) {
      //generar token y agregarlo a la respuesta
    }
    return usuario;
  }

  @post('/cambiar-clave')
  @response(200, {
    description: 'cambio de clave usuarios',
    content: {'application/json': {schema: getModelSchemaRef(CambioClave)}},
  })
  async cambiarClave(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CambioClave, {
            title: 'Cambio de clave del usuario'
          }),
        },
      },
    })
    credencialesClave: CambioClave,
  ): Promise<boolean | null> {
    let usuario = await this.adminDeClavesService.cambiarClave(credencialesClave);
    if (usuario) {
      //invocar al servicio de notificaciones para enviar correo al user
      let datos = new NotificacionCorreo();
      datos.destino = usuario.correo;
      datos.asunto = Configuracion.asuntoClave;
      datos.mensaje = `${Configuracion.saludo} ${usuario.nombre} <br> ${Configuracion.mensajeCambioClave}`
      this.notiService.enviarCorreo(datos);
    }
    return usuario != null;
  }


  @post('/recuperar-clave')
  @response(200, {
    description: 'cambio de clave usuarios',
    content: {'application/json': {schema: {}}},
  })
  async recuperarClave(
    @requestBody({
      content: {
        'application/json': {
          schema: {},
        },
      },
    })
    credenciales: CredencialesRecuperarClave,
  ): Promise<Usuario | null | boolean> {
    let usuario = await this.adminDeClavesService.recuperarClave(credenciales);
    if (usuario) {
      //invocar al servicio de notificaciones para enviar sms al user con la nueva clave
      return true;
    }
    return usuario;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



  @get('/usuarios/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }

  @get('/usuarios')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Usuario) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find(filter);
  }

  @patch('/usuarios')
  @response(200, {
    description: 'Usuario PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.updateAll(usuario, where);
  }

  @get('/usuarios/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Usuario, {exclude: 'where'}) filter?: FilterExcludingWhere<Usuario>
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, filter);
  }

  @patch('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Usuario, {partial: true}),
        },
      },
    })
    usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.updateById(id, usuario);
  }

  @put('/usuarios/{id}')
  @response(204, {
    description: 'Usuario PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() usuario: Usuario,
  ): Promise<void> {
    await this.usuarioRepository.replaceById(id, usuario);
  }

  @del('/usuarios/{id}')
  @response(204, {
    description: 'Usuario DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.usuarioRepository.deleteById(id);
  }



}
