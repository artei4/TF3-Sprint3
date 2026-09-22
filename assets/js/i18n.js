// Tradução simples: cada string em português (o texto original do site) é a própria
// chave do dicionário. `t('Texto em português')` devolve a tradução em espanhol se o
// idioma escolhido for 'es'; caso contrário devolve o texto original sem mudança.
// Isso permite traduzir aos poucos, sem quebrar nada que ainda não foi traduzido.

export const LANGS = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
]

export function getLang() {
  const saved = localStorage.getItem('ap_lang')
  return LANGS.some((l) => l.code === saved) ? saved : null
}

export function setLang(code) {
  localStorage.setItem('ap_lang', code)
  document.documentElement.lang = code === 'es' ? 'es' : 'pt-BR'
}

export function t(text) {
  const lang = getLang()
  if (lang === 'es' && ES[text] !== undefined) return ES[text]
  return text
}

// Aplica t() em cada valor de um objeto (útil para dicionários curtos: status, categorias...).
export function tMap(obj) {
  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, t(value)]))
}

const ES = {
  // Navegação
  'Início': 'Inicio',
  'Visão geral': 'Resumen',
  'Meu perfil': 'Mi perfil',
  'Perfil': 'Perfil',
  'Atletas': 'Atletas',
  'Peneiras': 'Pruebas',
  'Conversas': 'Conversaciones',
  'Comunicação': 'Comunicación',
  'Calendário': 'Calendario',
  'Central do funcionário': 'Central del empleado',
  'Painel do atleta': 'Panel del atleta',
  'Central': 'Central',
  'Notificações': 'Notificaciones',
  'Abrir notificações': 'Abrir notificaciones',
  'Ir para o início': 'Ir al inicio',
  'Sair': 'Cerrar sesión',
  'Idioma': 'Idioma',
  'Alterar idioma': 'Cambiar idioma',

  // Ações comuns
  'Entrar': 'Entrar',
  'Salvar': 'Guardar',
  'Cancelar': 'Cancelar',
  'Voltar': 'Volver',
  'Fechar': 'Cerrar',
  'Confirmar': 'Confirmar',
  'Editar perfil': 'Editar perfil',
  'Criar conta': 'Crear cuenta',
  'Criar conta de jogador': 'Crear cuenta de jugador',
  'Entrar com conta demo': 'Entrar con cuenta demo',
  'Pesquisar atletas': 'Buscar atletas',
  'Abrir banco completo': 'Ver todos los atletas',
  'Criar peneira': 'Crear prueba',
  'Ver peneiras': 'Ver pruebas',
  'Cancelar peneira': 'Cancelar prueba',
  'Cancelar peneira e avisar inscritos': 'Cancelar prueba y avisar a los inscritos',
  'Manter peneira': 'Mantener prueba',
  'Inscrever-me': 'Inscribirme',
  'Sem vagas': 'Sin cupos',
  'Posição/categoria incompatível': 'Posición/categoría incompatible',
  'Inscrição confirmada': 'Inscripción confirmada',
  'Cancelar minha inscrição': 'Cancelar mi inscripción',
  'Manter inscrição': 'Mantener inscripción',
  'Ver inscritos': 'Ver inscritos',
  'Ver perfil': 'Ver perfil',
  'Votar': 'Votar',
  'Retirar voto': 'Quitar voto',
  'Avaliar': 'Evaluar',
  'Salvar avaliação': 'Guardar evaluación',
  'Excluir minha avaliação': 'Eliminar mi evaluación',
  'Excluir avaliação': 'Eliminar evaluación',
  'Excluir sua avaliação?': '¿Eliminar tu evaluación?',
  'Mensagem': 'Mensaje',
  'Enviar mensagem': 'Enviar mensaje',
  'Escreva sua mensagem...': 'Escribe tu mensaje...',
  'Pesquisar': 'Buscar',
  'Limpar': 'Limpiar',
  'Limpar filtros': 'Limpiar filtros',
  'Exportar seleção': 'Exportar selección',
  'Favoritar': 'Marcar como favorito',

  // Login / cadastro
  'Acesso': 'Acceso',
  'Entrar na Academia Pelé': 'Entrar en Academia Pelé',
  'Escolha o tipo de conta antes de entrar.': 'Elige el tipo de cuenta antes de entrar.',
  'Jogador': 'Jugador',
  'Funcionário': 'Empleado',
  'E-mail': 'Correo electrónico',
  'Senha': 'Contraseña',
  'Confirmar senha': 'Confirmar contraseña',
  'ou': 'o',
  'Cadastro': 'Registro',
  'Voltar para o login': 'Volver al inicio de sesión',
  'Nome completo': 'Nombre completo',
  'Data de nascimento': 'Fecha de nacimiento',
  'Idade': 'Edad',
  'Categoria': 'Categoría',
  'Gênero': 'Género',
  'Telefone': 'Teléfono',
  'Posição principal': 'Posición principal',
  'Posição secundária': 'Posición secundaria',
  'Perna dominante': 'Pierna dominante',
  'Endereço': 'Dirección',
  'Cidade': 'Ciudad',
  'Estado': 'Estado',
  'Bairro': 'Barrio',
  'Número': 'Número',
  'CEP': 'Código postal',

  'Entrar na Academia Pelé': 'Entrar en Academia Pelé',
  'Escolha o tipo de conta antes de entrar.': 'Elige el tipo de cuenta antes de entrar.',
  'Clique para retirar seu voto': 'Haz clic para quitar tu voto',
  'Votar neste atleta': 'Votar por este atleta',
  'Voto retirado.': 'Voto retirado.',
  'Voto registrado com sucesso.': 'Voto registrado con éxito.',
  'Central do funcionário': 'Central del empleado',
  'Criar peneira': 'Crear prueba',
  'Seu radar': 'Tu radar',
  'Atletas para observar': 'Atletas para observar',
  'Abrir banco completo': 'Ver todos los atletas',
  'Painel do atleta': 'Panel del atleta',
  'Minha atividade': 'Mi actividad',
  'Dados do jogador': 'Datos del jugador',
  'Olheiros': 'Ojeadores',
  'Atributos': 'Atributos',
  'Avaliações': 'Evaluaciones',
  'Localidade': 'Ubicación',
  'Nova peneira': 'Nueva prueba',
  'Hoje': 'Hoy',
  'Buscar por nome': 'Buscar por nombre',
  'Posição principal ou secundária': 'Posición principal o secundaria',
  'Cidade/região': 'Ciudad/región',
  'Posição avaliada': 'Posición evaluada',
  'Comentário': 'Comentario',
  'Motivo do cancelamento (opcional)': 'Motivo de la cancelación (opcional)',
  'Posições disponíveis': 'Posiciones disponibles',
  'Ver inscritos': 'Ver inscritos',
  'Inscrição confirmada': 'Inscripción confirmada',
  'Cancelar minha inscrição': 'Cancelar mi inscripción',
  'Vagas preenchidas': 'Cupos ocupados',
  'vaga livre': 'cupo libre',
  'vagas livres': 'cupos libres',
  'Nenhuma peneira aberta': 'Ninguna prueba abierta',
  'Peneiras inscritas': 'Pruebas inscritas',
  // Peneiras / estatísticas
  'Aberta': 'Abierta',
  'Lotada': 'Completa',
  'vagas livres': 'cupos libres',
  'vaga livre': 'cupo libre',
  'Vagas preenchidas': 'Cupos ocupados',
  'Posições aceitas': 'Posiciones aceptadas',
  'Nenhuma peneira aberta': 'Ninguna prueba abierta',
  'Próxima oportunidade': 'Próxima oportunidad',
  'Peneiras inscritas': 'Pruebas inscritas',
  'Avaliação média': 'Evaluación promedio',
  'Atletas ativos': 'Atletas activos',
  'Perfis avaliados': 'Perfiles evaluados',
  'Mensagens': 'Mensajes',

  // Mensagens de erro/aviso comuns
  'Avaliação excluída.': 'Evaluación eliminada.',
  'Peneira criada e publicada.': 'Prueba creada y publicada.',
  'Inscrição cancelada. A vaga foi liberada.': 'Inscripción cancelada. El cupo fue liberado.',
  'Notificações limpas.': 'Notificaciones eliminadas.',
  'Dados do jogador atualizados.': 'Datos del jugador actualizados.',
  'Conta criada com sucesso.': 'Cuenta creada con éxito.',
  'Conta demo carregada.': 'Cuenta demo cargada.',
  'Atleta adicionado aos favoritos.': 'Atleta añadido a favoritos.',
  'Atleta removido dos favoritos.': 'Atleta eliminado de favoritos.',
  'Sessão encerrada.': 'Sesión cerrada.',
  'Inscrição confirmada.': 'Inscripción confirmada.',
  'Você recebeu uma nova notificação.': 'Recibiste una nueva notificación.',
  'Campo obrigatório.': 'Campo obligatorio.',
  'Informe um e-mail válido.': 'Ingresa un correo electrónico válido.',
  'As senhas não coincidem.': 'Las contraseñas no coinciden.',
  'Nenhum resultado encontrado.': 'Ningún resultado encontrado.',
  'Nenhuma conversa disponível no momento.': 'Ninguna conversación disponible por ahora.',
  'Nenhuma mensagem ainda. Envie a primeira mensagem para iniciar a conversa.': 'Aún no hay mensajes. Envía el primer mensaje para iniciar la conversación.',
  'Nenhuma avaliação registrada ainda.': 'Ninguna evaluación registrada todavía.',
}
