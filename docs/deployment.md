# Despliegue

Producción se encuentra en `https://davefrassoni.com/cybermorph/`. La raíz
Nginx existente de `davefrassoni.com` sirve `/var/www/davefrassoni`, por lo que
CyberMorph se despliega de forma aislada en el subdirectorio `cybermorph/` y no
reemplaza el portfolio principal.

No se necesitan secretos en el repositorio. Cada push a `main`:

1. ejecuta los tests y la comprobación de tipos del motor compartido;
2. compila la aplicación web con la ruta `/cybermorph/`;
3. genera el instalador de Windows de 64 bits;
4. publica la web y el instalador como artefactos de GitHub Actions;
5. reemplaza el release continuo `desktop-latest`, que contiene el instalador
   versionado, su blockmap y `latest.yml`.

En el VPS, `cybermorph-pull.timer` revisa la rama pública `main` cada minuto. Al
detectar un SHA diferente, [`deploy/server-pull.sh`](../deploy/server-pull.sh)
clona esa revisión exacta, repite los tests y el build, y sincroniza el sitio en
`/var/www/davefrassoni/cybermorph`. El directorio `downloads/` se sincroniza
desde el release continuo incluso cuando la web ya se encuentra en el SHA
actual. La aplicación consulta
`https://davefrassoni.com/cybermorph/downloads/latest.yml`, descarga el
instalador versionado y ofrece reiniciar para aplicar la actualización.

Una etiqueta `v*` crea además un GitHub Release que contiene el instalador.

## Despliegue manual en producción

Compilar localmente:

```powershell
npm ci
npm test
npm run build
npm run dist:win
```

Copiar el contenido de `apps/studio/dist` a
`/var/www/davefrassoni/cybermorph` y colocar el instalador en
`cybermorph/downloads/CyberMorph-Setup.exe`.

El sitio es una aplicación estática. No necesita base de datos, puertos
adicionales, webhooks ni un nuevo bloque Nginx. El timer de despliegue utiliza
únicamente conexiones HTTPS salientes.
