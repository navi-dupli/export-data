#!/bin/bash

# Nombre del servicio y región (ajusta según tu caso)
SERVICE_NAME="gateway"
REGION="us-central1"

# Obtener una lista de revisiones
REVISIONS=$(gcloud run revisions list --service $SERVICE_NAME --region $REGION --format="value(REVISION)")

# Iterar a través de las revisiones y eliminarlas
for REVISION_ID in $REVISIONS; do
  echo "Eliminando revisión $REVISION_ID..."
  gcloud run revisions delete $REVISION_ID --region $REGION --quiet
done

echo "Todas las revisiones han sido eliminadas."