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
   versionado, su blockmap y `latest.yml`;
6. abre una conexión SSH verificada, carga los artefactos en un directorio
   temporal y ejecuta [`deploy/deploy-artifacts.sh`](../deploy/deploy-artifacts.sh);
7. valida el SHA-512 del instalador, sincroniza la web, comprueba Nginx y
   consulta las URLs públicas.

El despliegue directo utiliza el Environment `production` de GitHub:

- secrets `VPS_SSH_PRIVATE_KEY` y `VPS_KNOWN_HOSTS`;
- variables `VPS_HOST`, `VPS_PORT`, `VPS_USER` y `VPS_DEPLOY_PATH`.

No se guarda ninguna credencial en el repositorio. El antiguo
`cybermorph-pull.timer` queda desactivado después del primer despliegue directo;
[`deploy/server-pull.sh`](../deploy/server-pull.sh) se conserva únicamente como
procedimiento de recuperación manual.

La aplicación consulta
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

El sitio es una aplicación estática. No necesita base de datos, webhooks ni un
nuevo bloque Nginx.
