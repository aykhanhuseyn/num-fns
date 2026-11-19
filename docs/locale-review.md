# Native-speaker locale review (task 0.9-3)

How to get the `ru` and `es` words checked by native speakers, and how to
apply what they send back.

```
 you ──link──► reviewer ──marks words──► "Finish and send"
                                              │
                                   num-fns-review-ru-<name>-<date>.json
                                              │
 you ◄──── Telegram / WhatsApp / email ───────┘
  │
  └─► bun run review:check <file>  ──►  edit src/locale/ru.ts  ──►  changeset (patch)
```

## 1. Send the link

One link per language. The link opens only that language, with the page in
that language. Nothing is sent while the reviewer works; answers stay in
their browser, so they can stop and continue later.

| Language | Link |
| --- | --- |
| Russian | <https://aykhanhuseyn.github.io/num-fns/review.html?lang=ru> |
| Spanish | <https://aykhanhuseyn.github.io/num-fns/review.html?lang=es> |

Any locale code works (`?lang=az`, `?lang=enGB`); a code with no UI table
gets English instructions. `review.html` with no `lang` shows all five
locales.

### Message to a Russian speaker

> Привет! Я делаю open-source библиотеку, которая пишет числа и суммы
> словами. Можешь проверить русские слова? Это 10–20 минут:
> https://aykhanhuseyn.github.io/num-fns/review.html?lang=ru
> Начни с фильтра «Начать здесь». В конце нажми «Готово — отправить»,
> скачай файл и пришли его мне сюда. Спасибо!

### Message to a Spanish speaker

> ¡Hola! Estoy haciendo una librería open source que escribe números y
> cantidades con palabras. ¿Puedes revisar las palabras en español? Son
> 10–20 minutos:
> https://aykhanhuseyn.github.io/num-fns/review.html?lang=es
> Empieza por el filtro «Empieza aquí». Al final pulsa «Terminar y enviar»,
> descarga el archivo y mándamelo por aquí. ¡Gracias!

Ask the Spanish reviewer which country they are from: some answers (the
decimal word «coma»/«punto», «millardo») differ between Spain and Latin
America.

## 2. Apply a file

One file per reviewer. The file name has the locale, the name and the date,
so several files can sit in one folder.

```sh
bun run review:check ~/Downloads/num-fns-review-ru-ivan-2026-11-20.json
```

The script checks that every corrected word is still the word the reviewer
saw, and prints the file and field to edit. Then:

1. Edit `src/locale/ru.ts` (or `es.ts`).
2. `bun test src/locale/golden.test.ts -u`; check that the diff touches only
   the corrected words.
3. Add a changeset. A word correction is a **patch**
   (`docs/versioning.md`).
4. When two reviewers disagree, ask a third, or keep the current word and
   write the question in the issue.

## 3. Record the result

When a locale is reviewed, write `reviewed: <date> by <name>` in the header
of the locale file and in the README locale table. With no reviewer by the
`1.0.0-rc.0` date, the locale ships labelled "machine-generated, not
reviewed" (0.9-3 fallback).
