import * as vendorService from '../services/vendorService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const createVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.createVendor(req.user._id, req.params.eventId, req.body);
  sendSuccess(res, 201, vendor, 'Vendor created successfully');
});

export const listVendors = asyncHandler(async (req, res) => {
  const vendors = await vendorService.listVendors(req.user._id, req.params.eventId, req.query);
  sendSuccess(res, 200, vendors);
});

export const getVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendor(req.user._id, req.params.eventId, req.params.id);
  sendSuccess(res, 200, vendor);
});

export const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendor(req.user._id, req.params.eventId, req.params.id, req.body);
  sendSuccess(res, 200, vendor, 'Vendor updated successfully');
});

export const updateVendorStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const vendor = await vendorService.updateVendorStatus(
    req.user._id,
    req.params.eventId,
    req.params.id,
    status,
    notes
  );
  sendSuccess(res, 200, vendor, 'Vendor status updated successfully');
});

export const deleteVendor = asyncHandler(async (req, res) => {
  await vendorService.deleteVendor(req.user._id, req.params.eventId, req.params.id);
  sendSuccess(res, 200, null, 'Vendor deleted successfully');
});
