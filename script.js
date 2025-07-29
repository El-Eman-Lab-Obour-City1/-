$(document).ready(function() {
    // تهيئة البيانات إذا لم تكن موجودة
    if (!localStorage.getItem('patients')) {
        localStorage.setItem('patients', JSON.stringify([]));
    }

    // تعيين تاريخ اليوم كقيمة افتراضية
    $('#testDate').val(new Date().toISOString().split('T')[0]);

    // دالة لعرض رسائل Toast
    function showToast(message, type = 'success') {
        const toastContainer = $('.toast-container');
        const toastId = 'toast-' + Date.now();
        
        const toast = $(`
            <div class="toast align-items-center text-white bg-${type} border-0" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `);
        
        toastContainer.append(toast);
        
        const bsToast = new bootstrap.Toast(toast[0]);
        bsToast.show();
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // دالة لتحميل وعرض المرضى
    function loadPatients(searchQuery = '') {
        const patients = JSON.parse(localStorage.getItem('patients'));
        let filteredPatients = patients;
        
        if (searchQuery) {
            filteredPatients = patients.filter(patient => {
                return patient.name.includes(searchQuery) || 
                       patient.phone.includes(searchQuery);
            });
        }
        
        // فرز المرضى حسب التاريخ (الأحدث أولاً)
        filteredPatients.sort((a, b) => {
            const dateA = a.added_date ? new Date(a.added_date) : new Date(0);
            const dateB = b.added_date ? new Date(b.added_date) : new Date(0);
            return dateB - dateA;
        });
        
        const resultsContainer = $('#resultsContainer');
        
        if (filteredPatients.length > 0) {
            let tableHTML = `
                <div class="results-table">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>اسم المريض</th>
                                <th>رقم الهاتف</th>
                                <th>حالة الدفع</th>
                                <th>التواريخ والنتائج</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            filteredPatients.forEach(patient => {
                tableHTML += `
                    <tr data-phone="${patient.phone}">
                        <td>${patient.name}</td>
                        <td>${patient.phone}</td>
                        <td>
                            <span class="payment-status ${patient.is_paid ? 'paid' : 'unpaid'}">
                                ${patient.is_paid ? 'تم الدفع' : 'لم يتم الدفع'}
                            </span>
                        </td>
                        <td>
                `;
                
                patient.tests.forEach(test => {
                    const fileUrl = URL.createObjectURL(test.fileObj);
                    tableHTML += `
                        <div class="file-item">
                            <span class="badge bg-light text-dark"><i class="far fa-calendar-alt"></i> ${test.date}</span>
                            <a href="${fileUrl}" target="_blank" class="pdf-link"><i class="fas fa-file-pdf"></i> عرض PDF</a>
                            <button class="btn btn-danger btn-sm py-0 delete-file-btn" 
                                data-file="${test.date}" 
                                data-phone="${patient.phone}">
                                <i class="fas fa-trash-alt"></i> حذف
                            </button>
                        </div>
                    `;
                });
                
                tableHTML += `
                        </td>
                        <td class="action-buttons">
                            <div class="d-flex flex-column gap-2">
                                <button class="btn btn-sm btn-success send-whatsapp-btn"
                                        data-phone="${patient.phone}">
                                    <i class="fab fa-whatsapp"></i> إرسال واتساب
                                </button>
                                <button class="btn btn-sm btn-info edit-patient-btn"
                                        data-phone="${patient.phone}">
                                    <i class="fas fa-edit"></i> تعديل
                                </button>
                                <button class="btn btn-sm ${patient.is_paid ? 'btn-warning' : 'btn-success'} toggle-payment-btn"
                                        data-phone="${patient.phone}">
                                    <i class="fas fa-money-bill-wave"></i> ${patient.is_paid ? 'إلغاء الدفع' : 'تم الدفع'}
                                </button>
                                <button class="btn btn-danger btn-sm delete-patient-btn"
                                        data-phone="${patient.phone}">
                                    <i class="fas fa-trash-alt"></i> حذف الكل
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            tableHTML += `
                        </tbody>
                    </table>
                </div>
            `;
            
            resultsContainer.html(tableHTML);
        } else {
            resultsContainer.html(`
                <div class="alert alert-info">
                    ${searchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد نتائج حتى الآن'}
                </div>
            `);
        }
        
        // إعادة ربط الأحداث
        bindEvents();
    }

    // دالة لربط الأحداث
    function bindEvents() {
        // حذف المريض
        $('.delete-patient-btn').on('click', function() {
            const phone = $(this).data('phone');
            const btn = $(this);
            const originalText = btn.html();
            
            if (!confirm('هل أنت متأكد أنك تريد حذف هذا المريض وكل تحليلاته؟')) return;
            
            btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> جاري الحذف...');
            
            setTimeout(() => {
                const patients = JSON.parse(localStorage.getItem('patients'));
                const updatedPatients = patients.filter(p => p.phone !== phone);
                localStorage.setItem('patients', JSON.stringify(updatedPatients));
                
                showToast('✅ تم حذف المريض بنجاح');
                loadPatients($('#searchInput').val());
            }, 500);
        });
        
        // تغيير حالة الدفع
        $('.toggle-payment-btn').on('click', function() {
            const phone = $(this).data('phone');
            const btn = $(this);
            const originalText = btn.html();
            
            btn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> جاري التحديث...');
            
            setTimeout(() => {
                const patients = JSON.parse(localStorage.getItem('patients'));
                const updatedPatients = patients.map(p => {
                    if (p.phone === phone) {
                        p.is_paid = !p.is_paid;
                    }
                    return p;
                });
                
                localStorage.setItem('patients', JSON.stringify(updatedPatients));
                
                showToast('✅ تم تحديث حالة الدفع');
                loadPatients($('#searchInput').val());
            }, 500);
        });
        
        // تعديل المريض
        $('.edit-patient-btn').on('click', function() {
            const phone = $(this).data('phone');
            const patients = JSON.parse(localStorage.getItem('patients'));
            const patient = patients.find(p => p.phone === phone);
            
            if (patient) {
                $('#patientName').val(patient.name);
                $('#patientPhone').val(patient.phone).prop('readonly', true);
                $('#testDate').val(patient.tests[0].date);
                $('#isPaid').prop('checked', patient.is_paid);
                
                $('#submitBtn').html('<i class="fas fa-save"></i> تحديث البيانات');
                $('#cancelEditBtn').removeClass('d-none');
                
                showToast('✅ يمكنك الآن تعديل بيانات المريض');
            }
        });
        
        // إرسال واتساب
        $('.send-whatsapp-btn').on('click', function() {
            const phone = $(this).data('phone');
            const patients = JSON.parse(localStorage.getItem('patients'));
            const patient = patients.find(p => p.phone === phone);
            
            if (patient) {
                const formattedPhone = formatPhoneNumber(patient.phone);
                const message = `عميلنا العزيز ${patient.name}، نتائج تحاليلك جاهزة. يمكنك الاطلاع عليها عبر التطبيق أو زيارة المعمل.`;
                const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
                
                window.open(whatsappUrl, '_blank');
            }
        });
    }

    // دالة لإضافة رمز الدولة إذا لم يكن موجوداً
    function formatPhoneNumber(phone) {
        phone = phone.replace(/[^0-9]/g, '');
        
        if (empty(phone)) {
            return '';
        }
        
        if (phone.startsWith('0')) {
            phone = '+20' + phone.substring(1);
        } else if (phone.startsWith('20')) {
            phone = '+' + phone;
        } else if (!phone.startsWith('+')) {
            phone = '+20' + phone;
        }
        
        return phone;
    }

    // معالجة إرسال النموذج
    $('#uploadForm').on('submit', function(e) {
        e.preventDefault();
        
        const patientName = $('#patientName').val().trim();
        const phone = $('#patientPhone').val().trim();
        const testDate = $('#testDate').val();
        const isPaid = $('#isPaid').is(':checked');
        const files = $('#pdfFiles')[0].files;
        const isEditMode = $('#cancelEditBtn').is(':visible');
        
        if (!patientName || !phone) {
            showToast('❌ اسم المريض ورقم الهاتف مطلوبان', 'danger');
            return;
        }
        
        if (!isEditMode && files.length === 0) {
            showToast('❌ يجب رفع ملف واحد على الأقل', 'danger');
            return;
        }
        
        const submitBtn = $('#submitBtn');
        const originalText = submitBtn.html();
        
        submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> جاري المعالجة...');
        
        setTimeout(() => {
            try {
                const patients = JSON.parse(localStorage.getItem('patients'));
                let patientIndex = patients.findIndex(p => p.phone === phone);
                
                // تحويل الملفات إلى Blob لتخزينها
                const filePromises = Array.from(files).map(file => {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            resolve({
                                name: file.name,
                                type: file.type,
                                data: e.target.result,
                                fileObj: file
                            });
                        };
                        reader.readAsDataURL(file);
                    });
                });
                
                Promise.all(filePromises).then(fileObjects => {
                    const tests = fileObjects.map(fileObj => ({
                        date: testDate,
                        file: fileObj.name,
                        fileObj: fileObj
                    }));
                    
                    if (patientIndex !== -1) {
                        // تحديث المريض الموجود
                        patients[patientIndex].name = patientName;
                        patients[patientIndex].is_paid = isPaid;
                        
                        if (!isEditMode) {
                            patients[patientIndex].tests = patients[patientIndex].tests.concat(tests);
                        }
                    } else {
                        // إضافة مريض جديد
                        patients.push({
                            name: patientName,
                            phone: phone,
                            is_paid: isPaid,
                            tests: tests,
                            added_date: new Date().toISOString()
                        });
                    }
                    
                    localStorage.setItem('patients', JSON.stringify(patients));
                    
                    showToast('✅ تم حفظ البيانات بنجاح');
                    
                    // إعادة تعيين النموذج
                    $('#uploadForm')[0].reset();
                    $('#patientPhone').prop('readonly', false);
                    $('#testDate').val(new Date().toISOString().split('T')[0]);
                    $('#submitBtn').html('<i class="fas fa-upload"></i> رفع النتائج');
                    $('#cancelEditBtn').addClass('d-none');
                    
                    // إعادة تحميل القائمة
                    loadPatients($('#searchInput').val());
                });
            } catch (error) {
                console.error('Error:', error);
                showToast('❌ حدث خطأ أثناء حفظ البيانات', 'danger');
            } finally {
                submitBtn.prop('disabled', false).html(originalText);
            }
        }, 1000);
    });

    // إلغاء التعديل
    $('#cancelEditBtn').on('click', function() {
        $('#uploadForm')[0].reset();
        $('#patientPhone').prop('readonly', false);
        $('#testDate').val(new Date().toISOString().split('T')[0]);
        $('#submitBtn').html('<i class="fas fa-upload"></i> رفع النتائج');
        $(this).addClass('d-none');
    });

    // البحث
    $('#searchForm').on('submit', function(e) {
        e.preventDefault();
        const searchQuery = $('#searchInput').val().trim();
        
        if (searchQuery) {
            $('#cancelSearchBtn').removeClass('d-none');
        }
        
        loadPatients(searchQuery);
    });

    // إلغاء البحث
    $('#cancelSearchBtn').on('click', function() {
        $('#searchInput').val('');
        $(this).addClass('d-none');
        loadPatients();
    });

    // تحميل البيانات الأولية
    loadPatients();
});