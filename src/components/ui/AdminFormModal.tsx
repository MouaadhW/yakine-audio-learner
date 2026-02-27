import { selectTheme } from '@/features/themeSlice';
import { useAppSelector } from '@/lib/hooks';
import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from './Text';

export interface FormField {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'url';
  required?: boolean;
  /** If provided, renders a picker instead of a text input */
  options?: { value: string; label: string }[];
}

interface AdminFormModalProps {
  visible: boolean;
  title: string;
  fields: FormField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
  saveLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export const AdminFormModal = ({
  visible,
  title,
  fields,
  values,
  onChange,
  onSave,
  onCancel,
  onDelete,
  deleteLabel = 'Delete',
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  loading = false,
}: AdminFormModalProps) => {
  const { colors } = useAppSelector(selectTheme);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {fields.map(field => (
              <View key={field.key} style={styles.fieldContainer}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {field.label}
                  {field.required ? ' *' : ''}
                </Text>
                {field.options ? (
                  <View style={styles.optionsRow}>
                    {field.options.map(opt => {
                      const selected = values[field.key] === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: selected
                                ? colors.primary
                                : colors.inputBackground,
                              borderColor: selected
                                ? colors.primary
                                : colors.border,
                            },
                          ]}
                          onPress={() => onChange(field.key, opt.value)}
                          disabled={loading}>
                          <Text
                            style={[
                              styles.optionChipText,
                              { color: selected ? '#fff' : colors.text },
                            ]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                <TextInput
                  style={[
                    styles.input,
                    field.multiline && styles.multilineInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.border,
                    },
                  ]}
                  value={values[field.key] ?? ''}
                  onChangeText={text => onChange(field.key, text)}
                  placeholder={field.placeholder ?? field.label}
                  placeholderTextColor={colors.muted}
                  multiline={field.multiline}
                  keyboardType={field.keyboardType}
                  textAlignVertical={field.multiline ? 'top' : 'center'}
                  editable={!loading}
                />
                )}
              </View>
            ))}
          </ScrollView>

          <View style={styles.actions}>
            {onDelete && (
              <TouchableOpacity
                style={[styles.btn, styles.deleteBtn, { backgroundColor: colors.error }]}
                onPress={() => {
                  Alert.alert(
                    deleteLabel,
                    '',
                    [
                      { text: cancelLabel, style: 'cancel' },
                      {
                        text: deleteLabel,
                        style: 'destructive',
                        onPress: onDelete,
                      },
                    ],
                  );
                }}
                disabled={loading}>
                <Text style={[styles.btnText, { color: colors.errorForeground }]}>
                  {deleteLabel}
                </Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.btn, { borderColor: colors.border, borderWidth: 1 }]}
              onPress={onCancel}
              disabled={loading}>
              <Text style={[styles.btnText, { color: colors.text }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 },
              ]}
              onPress={onSave}
              disabled={loading}>
              <Text style={[styles.btnText, { color: '#fff' }]}>{saveLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  scroll: {
    maxHeight: 400,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  deleteBtn: {},
  btnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
