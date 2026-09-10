export const Platform = {
  OS: 'ios',
  select: (obj: Record<string, any>) => obj.ios ?? obj.default,
};

export const StyleSheet = {
  create: <T extends Record<string, any>>(styles: T): T => styles,
};

export const StatusBar = () => null;
export const View = 'View';
export const Text = 'Text';
export const Pressable = 'Pressable';
export const TouchableOpacity = 'TouchableOpacity';
export const TextInput = 'TextInput';
export const ScrollView = 'ScrollView';
export const ActivityIndicator = 'ActivityIndicator';
export const KeyboardAvoidingView = 'KeyboardAvoidingView';
export const SafeAreaView = 'SafeAreaView';
export const Switch = 'Switch';
export const Modal = 'Modal';
export const RefreshControl = 'RefreshControl';
export const Alert = {
  alert: () => {},
};
export const Dimensions = {
  get: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
};
export default {
  Platform,
  StyleSheet,
  StatusBar,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  SafeAreaView,
  Switch,
  Modal,
  RefreshControl,
  Alert,
  Dimensions,
};
