import Vendor from '../models/Vendor.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import assertEventOwnership from '../utils/assertEventOwnership.js';

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {object} dto
 */
export const createVendor = async (userId, eventId, dto) => {
  await assertEventOwnership(eventId, userId);
  const vendor = await Vendor.create({ ...dto, event: eventId });
  logger.info('Vendor created', { vendorId: vendor._id, eventId, category: vendor.category });
  return vendor;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {{ status?, category?, page?, limit? }} query
 */
export const listVendors = async (userId, eventId, query = {}) => {
  await assertEventOwnership(eventId, userId);
  const { status, category, page = 1, limit = 50 } = query;

  const filter = { event: eventId };
  if (status) filter.status = status;
  if (category) filter.category = category;

  const skip = (page - 1) * limit;
  const [vendors, total] = await Promise.all([
    Vendor.find(filter)
      .populate('linkedSubEvents', 'name date')
      .sort({ category: 1, name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Vendor.countDocuments(filter),
  ]);

  return { vendors, total, page, pages: Math.ceil(total / limit) };
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} vendorId
 */
export const getVendor = async (userId, eventId, vendorId) => {
  await assertEventOwnership(eventId, userId);
  const vendor = await Vendor.findOne({ _id: vendorId, event: eventId })
    .populate('linkedSubEvents', 'name date startTime endTime')
    .populate('availability.subEvent', 'name date');
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  return vendor;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} vendorId
 * @param {object} dto
 */
export const updateVendor = async (userId, eventId, vendorId, dto) => {
  await assertEventOwnership(eventId, userId);
  const vendor = await Vendor.findOne({ _id: vendorId, event: eventId });
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  Object.assign(vendor, dto);
  await vendor.save();
  logger.info('Vendor updated', { vendorId, eventId, status: vendor.status });
  return vendor;
};

/**
 * Quick status-only update (e.g. one-click "Mark Confirmed" on dashboard).
 * @param {string} userId
 * @param {string} eventId
 * @param {string} vendorId
 * @param {string} status
 * @param {string} [notes]
 */
export const updateVendorStatus = async (userId, eventId, vendorId, status, notes) => {
  await assertEventOwnership(eventId, userId);
  const update = { status };
  if (notes !== undefined) update.notes = notes;

  const vendor = await Vendor.findOneAndUpdate(
    { _id: vendorId, event: eventId },
    { $set: update },
    { new: true, runValidators: true },
  );
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  logger.info('Vendor status updated', { vendorId, eventId, status });
  return vendor;
};

/**
 * @param {string} userId
 * @param {string} eventId
 * @param {string} vendorId
 */
export const deleteVendor = async (userId, eventId, vendorId) => {
  await assertEventOwnership(eventId, userId);
  const vendor = await Vendor.findOneAndDelete({ _id: vendorId, event: eventId });
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  // Clear venueId references in SubEvents pointing to this vendor
  const { default: SubEvent } = await import('../models/SubEvent.js');
  await SubEvent.updateMany({ event: eventId, venueId: vendorId }, { $set: { venueId: null } });

  logger.info('Vendor deleted', { vendorId, eventId });
};
