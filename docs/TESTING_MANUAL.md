# 🧪 Manual de Pruebas de la API

El proyecto incluye un robusto plan de pruebas para validar las capacidades geoespaciales y el CRUD de comerciantes.

## 📡 Ejecución de Pruebas HTTP

Utiliza la extensión **REST Client** para VS Code y abre el archivo:
`backend/merchants.http`

### Pruebas Principales:

1.  **Registro de Comerciante**: Crea un nuevo perfil con coordenadas geográficas.
2.  **Búsqueda por Cercanía**: Probando el radio de búsqueda (ej. 5km desde Puerto Viejo).
3.  **Filtrado por Categoría**: Restaurantes, Farmacias, etc.
4.  **Validación de Horarios**: Chequeo del campo JSONB de businessHours.

## 🚩 Comandos de Jest

```bash
# Pruebas unitarias
npm run test

# Pruebas e2e (Requiere base de datos de prueba)
npm run test:e2e
```

## 📍 Parámetros Geoespaciales Recomendados

Para pruebas en el Caribe Sur de Costa Rica:
- **Puerto Viejo**: `lat=9.6593, lng=-82.7527`
- **Cahuita**: `lat=9.7358, lng=-82.8451`
- **Manzanillo**: `lat=9.6333, lng=-82.6667`
