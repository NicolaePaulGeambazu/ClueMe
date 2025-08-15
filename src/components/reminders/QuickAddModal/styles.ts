import { StyleSheet } from 'react-native';
import { Fonts, FontSizes } from '../../../constants/Fonts';

export const createStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%', // Reduced from 85% to make it more compact
    minHeight: '40%', // Reduced from 50% to make it more compact
  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.bodySemibold,
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerSubtitleText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.body,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20, // Reduced from 24
  },
  sectionLabel: {
    fontSize: FontSizes.footnote,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: FontSizes.body,
    fontFamily: Fonts.body,
    minHeight: 48,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  selectorContainer: {
    flex: 1,
    minWidth: 0, // Ensures flex items can shrink below their content size
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  selectorText: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.body,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.bodyMedium,
  },
  floatingActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
    minWidth: 140,
  },
  floatingActionButtonText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.bodySemibold,
    color: colors.white,
  },
  helperText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.body,
    textAlign: 'center',
    marginTop: 8,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sheetHeader: {
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: FontSizes.title2,
    fontFamily: Fonts.bodySemibold,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sheetOptionContent: {
    flex: 1,
  },
  sheetOptionText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.bodyMedium,
    marginBottom: 4,
  },
  sheetOptionDescription: {
    fontSize: FontSizes.footnote,
    fontFamily: Fonts.body,
  },
  sheetOptionTime: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.bodyMedium,
  },
  sheetCancel: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  sheetCancelText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.bodyMedium,
  },
  breakDownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  breakDownText: {
    flex: 1,
  },
  breakDownSubtext: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.body,
    marginTop: 2,
  },

  // New visual design styles
  visualDateTimeContainer: {
    marginBottom: 20,
  },
  visualDateTimeCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visualDateTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  visualDateTimeTitle: {
    fontSize: FontSizes.title3,
    fontFamily: Fonts.bodySemibold,
    flex: 1,
  },
  visualDateTimeTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 32, // Align with the title text
  },
  visualDateTimeTimeText: {
    fontSize: FontSizes.body,
    fontFamily: Fonts.body,
  },
  quickActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  quickActionButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    gap: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: FontSizes.body,
    fontFamily: Fonts.body,
    paddingVertical: 4,
  },
  statusIndicators: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusChipText: {
    fontSize: FontSizes.caption1,
    fontFamily: Fonts.bodyMedium,
  },
});
