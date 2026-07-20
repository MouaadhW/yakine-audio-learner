import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { env } from './config/env';

let sdk: NodeSDK | null = null;

export async function initTracing() {
  if (sdk) return;

  const serviceName = process.env.SERVICE_NAME || 'yakine-backend';
  const traceEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || process.env.OTEL_EXPORTER_OTLP || undefined;

  const exporter = traceEndpoint
    ? new OTLPTraceExporter({ url: traceEndpoint })
    : undefined;

  sdk = new NodeSDK({
    resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: serviceName }),
    instrumentations: [getNodeAutoInstrumentations()],
    traceExporter: exporter,
  });

  try {
    await sdk.start();
    console.log('[tracing] OpenTelemetry initialized');
  } catch (err) {
    console.warn('[tracing] Failed to start OpenTelemetry', err);
  }
}

export async function shutdownTracing() {
  if (!sdk) return;
  try {
    await sdk.shutdown();
  } catch (err) {
    console.warn('[tracing] Failed to shutdown OpenTelemetry', err);
  }
}
