import type { LocaleReview, ReviewSection } from './types'

/**
 * The review page in the reviewer's own language.
 *
 * `review.html` shows all five locales with English instructions.
 * `review.html?lang=ru` (or `es`, …) is the link the maintainer sends to one
 * native speaker: it opens only that locale, hides the language tabs, and —
 * when a table exists below — speaks the reviewer's language. The words under
 * review never change with the UI language; only the page around them does.
 *
 * A reviewer without a GitHub account is the common case, so in that mode the
 * page asks for a downloaded file sent back by any messenger or email. The
 * page itself names no contact: the reviewer sends the file to the person who
 * gave them the link.
 */

export interface SectionText {
  title: string
  blurb: string
}

export interface GrammarText {
  heading: string
  gender: string
  case: string
  number: string
  usedAfter: string
  forms: string
  citation: string
  counted: string
  genders: Readonly<Record<'masculine' | 'feminine' | 'neuter', string>>
  cases: Readonly<Record<'nominative' | 'genitive', string>>
  numbers: Readonly<Record<'singular' | 'plural', string>>
}

export interface UiStrings {
  /** BCP 47 tag for `<html lang>`. */
  htmlLang: string
  docTitle: string
  navDocs: string
  heading: string
  lead: string
  steps: readonly [string, string][]
  privacy: string
  reviewerCaption: string
  reviewerPlaceholder: string
  filters: Readonly<
    Record<'priority' | 'todo' | 'flagged' | 'all', { label: string; hint: string }>
  >
  submit: string
  progress: (reviewed: number, total: number, flagged: number) => string
  emptyFlagged: string
  emptyFilter: string
  card: {
    needsNativeEye: string
    composed: string
    composedHint: string
    correct: string
    needsFixing: string
    correctWord: string
    correctPhrase: string
    suggestionPlaceholder: string
    why: string
    whyPlaceholder: string
    empty: string
  }
  dialog: {
    heading: (corrections: number, language: string) => string
    summary: (reviewed: number, total: number, approved: number) => string
    howToSend: string
    download: string
    copy: string
    copied: string
    github: string
    githubHint: string
    tooLong: string
    close: string
    clear: (language: string) => string
    preview: string
  }
  footerKeys: string
  footerThanks: string
  /** Names for the grammar facts on each card (`grammar.ts`). */
  grammar: GrammarText
  /** Labels for the page frame: skip link, theme toggle, dialog close. */
  frame: {
    skip: string
    toDark: string
    toLight: string
    menu: string
    closeDialog: string
    review: string
    playground: string
    home: string
    language: string
  }
  /** Section texts by section id; `fractions-missing` is the fractions gap. */
  sections: Readonly<Record<string, SectionText>>
  /** Item questions written by the page itself (not from `questions.ts`), by item slug. */
  itemQuestions: Readonly<Record<string, string>>
}

const en: UiStrings = {
  htmlLang: 'en',
  docTitle: 'Locale review — num-fns',
  navDocs: 'Docs',
  heading: 'Review the words for your language',
  lead: 'num-fns writes numbers, ordinals and money in words in five languages. Tests examine the code, but they cannot examine the words. The words come from dictionaries, not from native speakers. If you speak one of these languages, please review its words. This takes approximately ten minutes.',
  steps: [
    [
      'Select your language',
      'Review only a language that you speak. No answer is better than a guess.',
    ],
    [
      'Examine each entry',
      'Each entry shows the current output of the library. Mark it as correct, or write the correct text.',
    ],
    [
      'Send your review',
      'You can send it at any time. You can send it after only one answer. Download the file and send it to the person who gave you the link. Or open a GitHub issue.',
    ],
  ],
  privacy:
    'The page does not send data while you work. Your answers stay in this browser. You can close the tab and continue later.',
  reviewerCaption: 'Your name (optional, for the credits)',
  reviewerPlaceholder: 'Name or @handle',
  filters: {
    priority: { label: 'Start here', hint: 'Entries that we cannot examine ourselves' },
    todo: { label: 'Not reviewed', hint: 'Entries that you did not mark' },
    flagged: { label: 'Incorrect', hint: 'Entries that you marked as incorrect' },
    all: { label: 'All', hint: 'All entries' },
  },
  submit: 'Finish and send',
  progress: (reviewed, total, flagged) => `${reviewed} of ${total} reviewed · ${flagged} incorrect`,
  emptyFlagged:
    'No entries are marked as incorrect. On an entry, select the “Incorrect” button. The entry then shows here.',
  emptyFilter: 'No entries for this filter. Select “All”.',
  card: {
    needsNativeEye: 'native speaker needed',
    composed: 'phrase',
    composedHint:
      'The library makes this phrase from more than one field. A correction here shows an incorrect rule, not an incorrect word.',
    correct: 'Correct',
    needsFixing: 'Incorrect',
    correctWord: 'Correct word',
    correctPhrase: 'Correct phrase',
    suggestionPlaceholder: 'the correct text',
    why: 'Reason (optional)',
    whyPlaceholder: 'more information',
    empty: '(empty)',
  },
  dialog: {
    heading: (n, language) => `${n} correction${n === 1 ? '' : 's'} to ${language}`,
    summary: (reviewed, total, approved) =>
      `You reviewed ${reviewed} of ${total} entries. ${approved} are correct.`,
    howToSend:
      'Download the file. Send it to the person who gave you this link, by Telegram, WhatsApp or email. Do not change the file name.',
    download: 'Download review file',
    copy: 'Copy as text',
    copied: 'Copied',
    github: 'Open a GitHub issue',
    githubHint: 'Use this only if you have a GitHub account.',
    tooLong:
      'The report is too long for a link. The page copied it to your clipboard. Paste it into the issue body when GitHub opens.',
    close: 'Close',
    clear: (language) => `Delete my ${language} answers`,
    preview: 'Show the report text',
  },
  footerKeys:
    'Keys: j / k go to the next / previous entry · a marks correct · f marks incorrect · Esc leaves a field',
  footerThanks: 'Thank you. The next release includes your corrections and your name.',
  grammar: {
    heading: 'Grammar',
    gender: 'Gender',
    case: 'Case',
    number: 'Number',
    usedAfter: 'Used after',
    forms: 'Forms by gender',
    citation: 'Dictionary form',
    counted: 'Noun form after the count',
    genders: { masculine: 'masculine', feminine: 'feminine', neuter: 'neuter' },
    cases: { nominative: 'nominative', genitive: 'genitive' },
    numbers: { singular: 'singular', plural: 'plural' },
  },
  frame: {
    skip: 'Skip to content',
    toDark: 'Switch to dark theme',
    toLight: 'Switch to light theme',
    menu: 'Menu',
    closeDialog: 'Close',
    review: 'Review',
    playground: 'Playground',
    home: 'Home',
    language: 'Language',
  },
  sections: {},
  itemQuestions: {},
}

const ru: UiStrings = {
  htmlLang: 'ru',
  docTitle: 'Проверка русского языка — num-fns',
  navDocs: 'Документация',
  heading: 'Помогите проверить русские слова',
  lead: 'num-fns — библиотека, которая пишет числа, порядковые числительные и денежные суммы словами. Код проверен тестами, а слова — нет: они взяты из словарей, а не от носителей языка. Десять минут вашего времени помогут не выпустить ошибку для всех, кто пользуется библиотекой.',
  steps: [
    [
      'Проверьте каждую запись',
      'Каждое слово ниже — это то, что библиотека выдаёт сейчас. Отметьте «Верно» или напишите, как должно быть.',
    ],
    [
      'Начните с главного',
      'Фильтр «Начать здесь» показывает записи, которые мы сами проверить не можем. Остальное — по желанию.',
    ],
    [
      'Отправьте файл',
      'Можно отправить в любой момент, даже после одного ответа: нажмите «Готово», скачайте файл и отправьте его тому, кто дал вам эту ссылку.',
    ],
  ],
  privacy:
    'Пока вы работаете, ничего никуда не отправляется. Ответы хранятся в этом браузере: можно закрыть вкладку и вернуться позже.',
  reviewerCaption: 'Ваше имя (необязательно, для благодарности)',
  reviewerPlaceholder: 'Имя',
  filters: {
    priority: { label: 'Начать здесь', hint: 'Записи, которые мы не можем проверить сами' },
    todo: { label: 'Не проверено', hint: 'Всё, что вы ещё не отметили' },
    flagged: { label: 'С ошибкой', hint: 'Записи, отмеченные как ошибочные' },
    all: { label: 'Все', hint: 'Полный список слов' },
  },
  submit: 'Готово — отправить',
  progress: (reviewed, total, flagged) => `Проверено ${reviewed} из ${total} · ошибок: ${flagged}`,
  emptyFlagged: 'Пока ничего не отмечено. Нажмите «Ошибка» у записи, и она появится здесь.',
  emptyFilter: 'В этом фильтре ничего не осталось. Откройте «Все».',
  card: {
    needsNativeEye: 'нужен носитель языка',
    composed: 'фраза',
    composedHint:
      'Собрано из нескольких слов. Исправление здесь говорит нам, что неверно правило, а не одно слово.',
    correct: 'Верно',
    needsFixing: 'Ошибка',
    correctWord: 'Правильное слово',
    correctPhrase: 'Правильная фраза',
    suggestionPlaceholder: 'как должно быть',
    why: 'Почему (необязательно)',
    whyPlaceholder: 'комментарий',
    empty: '(пусто)',
  },
  dialog: {
    heading: (n) => `Исправлений: ${n}`,
    summary: (reviewed, total, approved) =>
      `Вы проверили ${reviewed} из ${total} записей, ${approved} отмечены как верные.`,
    howToSend:
      'Скачайте файл и отправьте его тому, кто дал вам эту ссылку — в Telegram, WhatsApp или по почте. Не переименовывайте файл.',
    download: 'Скачать файл',
    copy: 'Скопировать текстом',
    copied: 'Скопировано',
    github: 'Открыть issue на GitHub',
    githubHint: 'Только если у вас есть аккаунт GitHub.',
    tooLong:
      'Отчёт слишком длинный для ссылки. Он скопирован в буфер обмена: вставьте его в текст issue, когда откроется GitHub.',
    close: 'Закрыть',
    clear: () => 'Удалить мои ответы',
    preview: 'Показать текст отчёта',
  },
  footerKeys:
    'Клавиши: j / k — следующая / предыдущая · a — верно · f — ошибка · Esc — выйти из поля',
  footerThanks: 'Спасибо! Исправления войдут в следующую версию, с указанием вашего имени.',
  grammar: {
    heading: 'Грамматика',
    gender: 'Род',
    case: 'Падеж',
    number: 'Число',
    usedAfter: 'После чисел',
    forms: 'Формы по роду',
    citation: 'Начальная форма',
    counted: 'Форма существительного после числа',
    genders: { masculine: 'мужской', feminine: 'женский', neuter: 'средний' },
    cases: { nominative: 'именительный', genitive: 'родительный' },
    numbers: { singular: 'единственное', plural: 'множественное' },
  },
  frame: {
    skip: 'Перейти к содержанию',
    toDark: 'Тёмная тема',
    toLight: 'Светлая тема',
    menu: 'Меню',
    closeDialog: 'Закрыть',
    review: 'Проверка',
    playground: 'Песочница',
    home: 'Главная',
    language: 'Язык',
  },
  sections: {
    numerals: {
      title: 'Числа',
      blurb:
        'Базовые слова, из которых строится любое число. Ошибка здесь повторяется в тысячах результатов, поэтому стоит прочитать даже очевидное.',
    },
    scales: {
      title: 'Тысячи, миллионы…',
      blurb: 'Слова разрядов и их формы после 1, 2–4 и 5+.',
    },
    readings: {
      title: 'Числа целиком',
      blurb: 'Целые числа и дроби так, как их читают вслух.',
    },
    decimals: {
      title: 'Десятичные дроби',
      blurb:
        'Числа с дробной частью так, как их произносят. Проверьте слово после целой части и как читаются цифры после запятой.',
    },
    ordinals: {
      title: 'Порядковые числительные',
      blurb: 'Первый, второй, … и короткая запись вроде «3-й».',
    },
    notation: {
      title: 'Сокращения',
      blurb: 'Сокращения в короткой записи («2,5 млн») и их полные слова.',
    },
    currency: {
      title: 'Названия валют',
      blurb: 'Рубль, копейка, манат, гяпик, доллар… и их формы после 1, 2–4 и 5+.',
    },
    money: {
      title: 'Суммы словами',
      blurb: 'Суммы так, как их произносят, в том числе около нуля и единицы.',
    },
    formatting: {
      title: 'Формат чисел и денег',
      blurb: 'Разделители и место знака валюты — то, что читатель замечает сразу.',
    },
    fractions: {
      title: 'Дроби',
      blurb: 'Простые дроби словами.',
    },
    'fractions-missing': {
      title: 'Дроби',
      blurb: 'Для русского языка ещё нет. Это главный пробел, с которым вы можете помочь.',
    },
    digits: {
      title: 'По одной цифре',
      blurb: 'Как читают код или номер телефона — по одной цифре.',
    },
  },
  itemQuestions: {
    'fractions-missing':
      'Библиотека не угадывает дроби. Если можете, напишите в поле словами: 1/2, 1/3, 2/3, 3/4 и 5/8.',
  },
}

const es: UiStrings = {
  htmlLang: 'es',
  docTitle: 'Revisión del español — num-fns',
  navDocs: 'Documentación',
  heading: 'Ayúdanos a revisar las palabras en español',
  lead: 'num-fns es una librería que escribe números, ordinales y cantidades de dinero con palabras. El código está probado, pero las palabras no: salieron de diccionarios, no de hablantes nativos. Diez minutos de tu tiempo evitan que un error llegue a todos los que usan la librería.',
  steps: [
    [
      'Revisa cada entrada',
      'Cada palabra es lo que la librería devuelve hoy. Márcala como «Correcto» o escribe cómo debería ser.',
    ],
    [
      'Empieza por lo importante',
      'El filtro «Empieza aquí» muestra lo que no podemos comprobar nosotros. El resto es opcional.',
    ],
    [
      'Envía el archivo',
      'Puedes enviarlo en cualquier momento, incluso con una sola respuesta: pulsa «Terminar», descarga el archivo y envíalo a quien te dio este enlace.',
    ],
  ],
  privacy:
    'Mientras trabajas no se envía nada. Tus respuestas se guardan en este navegador: puedes cerrar la pestaña y volver más tarde.',
  reviewerCaption: 'Tu nombre (opcional, para el agradecimiento)',
  reviewerPlaceholder: 'Nombre',
  filters: {
    priority: { label: 'Empieza aquí', hint: 'Lo que no podemos comprobar nosotros' },
    todo: { label: 'Sin revisar', hint: 'Todo lo que aún no has marcado' },
    flagged: { label: 'Con error', hint: 'Lo que marcaste como incorrecto' },
    all: { label: 'Todo', hint: 'La lista completa de palabras' },
  },
  submit: 'Terminar y enviar',
  progress: (reviewed, total, flagged) =>
    `${reviewed} de ${total} revisadas · ${flagged} con error`,
  emptyFlagged: 'Aún no hay nada marcado. Pulsa «Error» en una entrada y aparecerá aquí.',
  emptyFilter: 'No queda nada en este filtro. Prueba «Todo».',
  card: {
    needsNativeEye: 'necesita un nativo',
    composed: 'frase',
    composedHint:
      'Formado con varias palabras. Una corrección aquí nos dice que una regla está mal, no una sola palabra.',
    correct: 'Correcto',
    needsFixing: 'Error',
    correctWord: 'Palabra correcta',
    correctPhrase: 'Frase correcta',
    suggestionPlaceholder: 'cómo debería ser',
    why: 'Por qué (opcional)',
    whyPlaceholder: 'comentario',
    empty: '(vacío)',
  },
  dialog: {
    heading: (n) => `Correcciones: ${n}`,
    summary: (reviewed, total, approved) =>
      `Revisaste ${reviewed} de ${total} entradas; ${approved} están correctas.`,
    howToSend:
      'Descarga el archivo y envíalo a quien te dio este enlace, por Telegram, WhatsApp o correo. No cambies el nombre del archivo.',
    download: 'Descargar archivo',
    copy: 'Copiar como texto',
    copied: 'Copiado',
    github: 'Abrir un issue en GitHub',
    githubHint: 'Solo si tienes cuenta de GitHub.',
    tooLong:
      'El informe es demasiado largo para un enlace. Está copiado al portapapeles: pégalo en el texto del issue cuando se abra GitHub.',
    close: 'Cerrar',
    clear: () => 'Borrar mis respuestas',
    preview: 'Ver el texto del informe',
  },
  footerKeys: 'Teclado: j / k mover · a correcto · f error · Esc salir del campo',
  footerThanks: '¡Gracias! Las correcciones saldrán en la próxima versión, con tu nombre.',
  grammar: {
    heading: 'Gramática',
    gender: 'Género',
    case: 'Caso',
    number: 'Número',
    usedAfter: 'Después de',
    forms: 'Formas por género',
    citation: 'Forma de diccionario',
    counted: 'Forma del sustantivo tras el número',
    genders: { masculine: 'masculino', feminine: 'femenino', neuter: 'neutro' },
    cases: { nominative: 'nominativo', genitive: 'genitivo' },
    numbers: { singular: 'singular', plural: 'plural' },
  },
  frame: {
    skip: 'Ir al contenido',
    toDark: 'Tema oscuro',
    toLight: 'Tema claro',
    menu: 'Menú',
    closeDialog: 'Cerrar',
    review: 'Revisión',
    playground: 'Pruebas',
    home: 'Inicio',
    language: 'Idioma',
  },
  sections: {
    numerals: {
      title: 'Números',
      blurb:
        'Las palabras base con las que se forma cualquier número. Un error aquí se repite en miles de resultados, así que vale la pena leer incluso lo obvio.',
    },
    scales: {
      title: 'Mil, millón…',
      blurb: 'Las palabras de escala y sus formas en singular y plural.',
    },
    readings: {
      title: 'Números completos',
      blurb: 'Números enteros y decimales tal como se leen en voz alta.',
    },
    decimals: {
      title: 'Decimales',
      blurb:
        'Números con parte decimal, como se dicen en voz alta. Revisa la palabra después de la parte entera y cómo se leen las cifras después de la coma.',
    },
    ordinals: {
      title: 'Ordinales',
      blurb: 'Primero, segundo, … y la forma corta como «3º».',
    },
    notation: {
      title: 'Abreviaturas',
      blurb: 'Las abreviaturas de la forma corta («2,5 M») y sus palabras completas.',
    },
    currency: {
      title: 'Nombres de monedas',
      blurb: 'Euro, céntimo, dólar, manat, rublo… en singular y plural.',
    },
    money: {
      title: 'Cantidades en palabras',
      blurb: 'Cantidades tal como se dicen, también las difíciles cerca de cero y de uno.',
    },
    formatting: {
      title: 'Formato de números y dinero',
      blurb: 'Separadores y posición del símbolo: lo que un lector nota enseguida.',
    },
    fractions: {
      title: 'Fracciones',
      blurb: 'Fracciones simples en palabras.',
    },
    'fractions-missing': {
      title: 'Fracciones',
      blurb: 'Todavía no existen para el español. Es el hueco donde más puedes ayudar.',
    },
    digits: {
      title: 'Dígito a dígito',
      blurb: 'Cómo se lee un código o un teléfono, un dígito cada vez.',
    },
  },
  itemQuestions: {
    'fractions-missing':
      'La librería no adivina fracciones. Si puedes, escribe en el campo: 1/2, 1/3, 2/3, 3/4 y 5/8.',
  },
}

/** UI tables by review code. A code with no table uses English. */
const TABLES: Readonly<Record<string, UiStrings>> = { ru, es }

export interface PageMode {
  /** The one locale this link is for, or `undefined` for the all-locales page. */
  locked?: LocaleReview
  ui: UiStrings
}

/** Reads `?lang=` and picks the locale and the UI language. An unknown code falls back to the full page. */
export function resolveMode(search: string, reviews: readonly LocaleReview[]): PageMode {
  const lang = new URLSearchParams(search).get('lang')
  const locked = reviews.find((review) => review.code === lang)
  if (!locked) return { ui: en }
  return { locked, ui: TABLES[locked.code] ?? en }
}

/** The section heading in the UI language; the fractions gap has its own text. */
export function sectionText(ui: UiStrings, section: ReviewSection): SectionText | undefined {
  const missing = section.items.some((item) => item.id.endsWith('/fractions-missing'))
  return ui.sections[missing ? 'fractions-missing' : section.id]
}

/** A question the page asks in the UI language, keyed by the last part of the item id. */
export function itemQuestion(ui: UiStrings, itemId: string): string | undefined {
  const slug = itemId.slice(itemId.lastIndexOf('/') + 1)
  return ui.itemQuestions[slug]
}

const NON_WORD = /[^\p{L}\p{N}]+/gu
const EDGE_DASHES = /^-+|-+$/g

/** `num-fns-review-ru-ivan-2026-11-19.json`: one file per person, safe to collect in one chat. */
export function reviewFileName(localeCode: string, reviewer: string, date: Date): string {
  const name = reviewer.trim().toLowerCase().replace(NON_WORD, '-').replace(EDGE_DASHES, '')
  const day = date.toISOString().slice(0, 10)
  return `${['num-fns-review', localeCode, name, day].filter(Boolean).join('-')}.json`
}
