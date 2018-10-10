# nodapi
Un ejercicio de API RESTful con NodeJS utilizando la menor cantidad posible de paquetes externos

## Pre requisitos
- GIT
- Mysql 5 o MariaDB 10 o superior
- NodeJS 9 o superior
- Visual Code como Editor de Código

## Se asume
- El entorno NodeJS debe estar configurado en el sistema. El directorio de instalación (donde pondremos nuestros archivos) dependerá del sistema operativo. En linux sería usualmente en un directorio como /var/www/html y en windows c:/Documents/
- Acceso a una consola de comandos. En Windows usaríamos DOS, la consola de comando integrada en Visual Code o GIT console

## Instalación

1. Desde consola de comando y en el directorio de instalación (htdocs) ejecutar: `git clone https://github.com/luchhh/nodapi.git nodapi`
2. Explorar el código descargado con nuestro Editor de Código
3. Instalar la base de datos de ejemplo: `data_ejemplo.sql`
4. Copiar el archivo `config.ejemplo.json` a `config.json`
5. Modificar el archivo `config.json` con los datos de base de datos y URL de la aplicación correctos
6. Desde el directorio nodapi ejecutar `npm update` para instalar las dependencias
7. Acceder mediante la URL `http://localhost:8000/libros/`

## Uso de la API

- El endpoint de esta API es `/libros/?`. Pueden pasarse los siguientes parámetros:
	- `ini`: El número de página a mostrar. Por defecto 1.
	- `lim`: El número de resultados por página. Por defecto 10.
	- `q`: Una query para buscar libros. Busca en las propiedades `nombre` y `descripcion` 
	- `ord`: El orden en que deben ordenarse los recursos antes de ser paginados. Es posible utilizar las propiedades del libro: `nombre`, `descripcion`, `url`,`creada` y `modificada`. Pueden concatenarse varias propiedades con una coma `,` entre ellas. El signo menos `-` antes de la propiedad significa orden descendente

- Para acceder a la información de un libro `/libros/1`, donde 1 es el ID del libro

- Para agregar un libro hay que realizar un POST sobre `/libros/` donde el cuerpo del POST es una estructura JSON

```
{
  "data": {
    "nombre": "Cien años de soledad",
    "descripcion": "Es considerada una obra maestra de la literatura hispanoamericana y universal, así como una de las obras más traducidas y leídas en español",
    "url": "https://books.google.es/books?id=QBwnDwAAQBAJ&printsec=frontcover"
  }
}
```
- Para actualizar un libro hay que realizar un PUT sobre `/libros/1` donde 1 es el ID del título que queremos actualizar y el cuerpo del mensaje debe ser una estructura JSON como la vista anteriormente

La información completa de esta API puede verse en `http://localhost:8000/docs/`
