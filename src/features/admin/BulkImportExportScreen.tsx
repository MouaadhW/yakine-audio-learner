import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { dirRow } from '@/lib/rtl';
import { DownloadIcon, UploadIcon } from 'lucide-react-native';
import { Text } from '@/components/ui/Text';
import { useAppSelector } from '@/lib/hooks';
import { selectTheme } from '@/features/themeSlice';
import { bulkExport, bulkImport, BulkExport } from '@/lib/services/AdminApi';
import * as Clipboard from 'expo-clipboard';

const BulkImportExportScreen = () => {
  const { colors } = useAppSelector(selectTheme);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [exportedData, setExportedData] = useState<BulkExport | null>(null);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setResult('');
    try {
      const data = await bulkExport();
      setExportedData(data);
      const json = JSON.stringify(data, null, 2);
      await Clipboard.setStringAsync(json);
      setResult(
        `Export complete! ${data.subjects.length} subjects exported.\nJSON copied to clipboard (${(json.length / 1024).toFixed(1)} KB).`,
      );
    } catch (e: any) {
      setResult(`Export failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImportFromClipboard = useCallback(async () => {
    setLoading(true);
    setResult('');
    try {
      const clipboardText = await Clipboard.getStringAsync();
      if (!clipboardText) {
        setResult('Clipboard is empty. Copy a valid JSON export first.');
        setLoading(false);
        return;
      }

      let data: BulkExport;
      try {
        data = JSON.parse(clipboardText);
      } catch {
        setResult('Invalid JSON in clipboard.');
        setLoading(false);
        return;
      }

      if (!data.version || !data.subjects) {
        setResult('Invalid export format. Must have "version" and "subjects" fields.');
        setLoading(false);
        return;
      }

      Alert.alert(
        'Confirm Import',
        `Import ${data.subjects.length} subjects from clipboard?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
          {
            text: 'Import',
            onPress: async () => {
              try {
                const res = await bulkImport(data);
                setResult(
                  `Import complete!\n- ${res.imported.subjects} subjects\n- ${res.imported.chapters} chapters\n- ${res.imported.lessons} lessons`,
                );
              } catch (e: any) {
                setResult(`Import failed: ${e.message}`);
              } finally {
                setLoading(false);
              }
            },
          },
        ],
      );
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
      setLoading(false);
    }
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.header, { color: colors.text }]}>Bulk Import / Export</Text>
      <Text style={[styles.description, { color: colors.muted }]}>
        Export all subjects, chapters, and lessons as JSON for backup or migration.
        Import by copying the JSON to your clipboard.
      </Text>

      {/* Export */}
      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
        disabled={loading}
        onPress={handleExport}
        activeOpacity={0.7}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
          <DownloadIcon size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Export Data</Text>
          <Text style={[styles.actionDesc, { color: colors.muted }]}>
            Export all content as JSON to clipboard
          </Text>
        </View>
      </TouchableOpacity>

      {/* Import */}
      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.card, borderColor: '#f59e0b' }]}
        disabled={loading}
        onPress={handleImportFromClipboard}
        activeOpacity={0.7}>
        <View style={[styles.iconCircle, { backgroundColor: '#f59e0b20' }]}>
          <UploadIcon size={24} color="#f59e0b" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Import from Clipboard</Text>
          <Text style={[styles.actionDesc, { color: colors.muted }]}>
            Paste exported JSON in clipboard, then tap here
          </Text>
        </View>
      </TouchableOpacity>

      {/* Result */}
      {loading && (
        <Text style={[styles.resultText, { color: colors.primary }]}>Processing...</Text>
      )}
      {!!result && (
        <View style={[styles.resultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.resultText, { color: colors.text }]}>{result}</Text>
        </View>
      )}

      {/* Preview exported data summary */}
      {exportedData && (
        <View style={[styles.resultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>Export Preview</Text>
          {exportedData.subjects.map((s, i) => (
            <Text key={i} style={[styles.previewItem, { color: colors.muted }]}>
              {s.icon || '📚'} {s.nameEn} — {s.chapters?.length ?? 0} chapters
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  actionCard: {
    flexDirection: dirRow(),
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
    gap: 14,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: { fontSize: 16, fontWeight: '600' },
  actionDesc: { fontSize: 13, marginTop: 2 },
  resultBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  resultText: { fontSize: 14, lineHeight: 20 },
  previewTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  previewItem: { fontSize: 13, marginBottom: 4 },
});

export default BulkImportExportScreen;
