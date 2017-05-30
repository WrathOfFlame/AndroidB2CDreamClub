/**
 * Created by Ogarenko on 21.04.2015.
 */

ons.ready(function () {

    WEBPassport.Models.MainViewModel=Backbone.Model.extend({
        defaults:{
            email:"",
            new_email:"",
            state:"",
            lname:"",
            fname:"",
            last_name:"",
            first_name: "",
            mobile:"",
            new_mobile:"",
            sex:"",
            pin_tries:3,
            myqr_mobile:"",
            reset_pin:"",
            birthday:"",
            telephone:""
        },

        initialize: function () {
            console.log("WEBPassport.Models.MainViewModel:initialize");

            this.listenTo(this,'change:state',this.onStateChanged)
        },

        onStateChanged: function () {
            console.log("WEBPassport.Models.MainViewModel:onStateChanged");
            console.log("state changed from "+this.previous("state")+" to "+this.get("state"));
           // Backbone.trigger('mainview:renderLayout');
        },

        onInvalidPin: function () {
            console.log("WEBPassport.Models.MainViewModel:onInvalidPin");
            this.set('pin_tries',this.get('pin_tries')-1);
        },

        isValidDataForCards: function () {
            console.log("WEBPassport.Models.MainViewModel:isValidDataForCards");
            if(!this.get('email')||!this.get('fname')||!this.get('lname')||!this.get('mobile')){
                if(!this.get('email'))this.set('email','');
                if(!this.get('fname'))this.set('fname','');
                if(!this.get('lname'))this.set('lname','');
                if(!this.get('mobile'))this.set('mobile','');
                return false;
            }

            return true;
        },

        isPhoneValid: function () {
            console.log("WEBPassport.Models.MainViewModel:isPhoneValid");

            if(!this.get('mobile')) {
                return false;
            }
            return true;
        }

    });

    WEBPassport.mainViewModel=new WEBPassport.Models.MainViewModel();
});
ons.ready(function () {

    // флаг для состояния бокового меню
    window.isOpenMenu = false;

    //вьюшка для контейнера навигации ( основа )
    // меню рендерить от вьюшке и по шаблону для того что меню разное показывать на разных страницах
    WEBPassport.Views.MainView = Marionette.ItemView.extend({
        el: "#perspective",
        ui: {
            context_menu: "#context_menu", // блок меню
            left_user_bar: "#left_user_bar", // левое меню приложения
            right_context_bar: "#right_context_bar", // правое боковое меню ( всегда разное на каждой странице )
        },
        events: {
            "click": "closeMenu",  //обработка клика
        },
        initialize: function () {
            console.log('WEBPassport.Views.MainView:initialize');

            this.listenTo(Backbone, 'WEBPassport.Views.MainView:openMenu', this.openMenu);
            this.listenTo(Backbone, 'WEBPassport.Views.MainView:closeMenu', this.closeMenu);

            this.listenTo(Backbone, 'WEBPassport.Views.MainView:openUserMenu', this.openUserMenu);

            // функция для рендеринка менюшек для страниц
            this.listenTo(Backbone, 'WEBPassport.Views.MainView:renderContextMenu', this.renderContextMenu);

            // для уничтожения полностью дашборда
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:clearAll', this.clearAll);

            // отслеживание url
            this.listenTo(Backbone, 'WEBPassport.Views.MainView:handleURL', this.handleURL);

            _.bindAll(this, 'sendFromLink');

            this.bindUIElements();

            //  рендерим вьюшку бокового правого меню
            //this.renderContextMenu(WEBPassport.Views.DashboardMenu);

            /************************************************************/

            // отслеживание url
            if (isMobile) {
                if (device.platform.toLowerCase() == 'android') {
                    window.plugins.webintent.onNewIntent(this.sendFromLink);
                    window.plugins.webintent.getUri(this.sendFromLink);
                }
            }

            var browsingData = document.URL;
            console.log(document.URL);
            console.log(browsingData.indexOf('otp=') + 4);

            // если сохранен пинкод показываем окно с вводом пинкода
            // если нет то окно с регистрацией

            if(wlPath == "Fishka")
            {
                mobipayNavigatorOpen(mobipayPage.fishka_dashboard, "none");

            }
            else if (!localStorage.pin && isAuthFirstPhone) {
                // this.model.set('state', 'pin_enter');
                mobipayNavigatorOpen(mobipayPage.new_wallet, "none", { newWalletOption: 'auth' });
            }
            else if ((localStorage.pin && localStorage.pin != "") || isBusiness) {
               // this.model.set('state', 'pin_enter');
                mobipayNavigatorOpen(mobipayPage.pin, "none", { state: 'pin_enter' });
            }
            else {
                mobipayNavigatorOpen(mobipayPage.auth_for_phone, "none");

                //this.model.set('state', cmd_names.CMD_AUTH_REG_EMAIL);
                //this.model.set('reset_pin', 'hidden');
            }

            //инициализируем вьюшку для контроля открытия/закрытия модулей
            // this.viewModulesController = new WEBPassport.Views.ModuleTagWayController();


        },
        sendFromLink: function (url) {
            if (url) {
                console.log(url);
                //вход авторизация
                if (url.indexOf("otp") > -1) {
                    var otp = url.replace("news://otp-", "").replace("?from=email", "");
                    if (otp) {
                        if (url.indexOf("?from=email") > -1) {
                            Backbone.trigger('WEBPassport.Views.OTP:enterOTP', otp);
                        }
                        else {
                            //отправка отр и выход
                            switch (mobipay_navigator.getCurrentPage().name) {
                                case '':
                                case undefined:
                                case mobipayPage.auth:
                                case mobipayPage.otp:
                                case mobipayPage.pin:
                                    //для отправки отр
                                    this.options.otpUrl = otp;
                                    this.options.isExitForUrl = true;
                                    break;

                                default:
                                    Backbone.trigger("WEBPassport.Views.QRScannerWidget:sendOtp", otp, false);
                                    break;
                            }
                        }
                    }
                }
                // 3D secure
                else if (url.indexOf('p2purl') > -1) {
                    var url = url.replace("news://p2purl-", "");
                    if (url) {
                        var ref = window.open(url, '_blank', 'location=no');
                    }
                }
                // оплата
                else if (url.indexOf("pay") > -1) {
                    var token = url.replace("news://pay-", "");
                    if (token) {
                        //отправка pay и выход
                        switch (mobipay_navigator.getCurrentPage().name) {
                            case '':
                            case undefined:
                            case mobipayPage.auth:
                            case mobipayPage.otp:
                            case mobipayPage.pin:
                                this.options.payUrl = token;
                                this.options.isExitForUrl = true;
                                break;

                            default:
                                Backbone.trigger("WEBPassport.Views.QRScannerWidget:sendPay", token, false);
                                break;
                        }
                    }
                }
                //приглашение
                else if (url.indexOf("invite") > -1) {
                    var myqr = url.replace("news://invite-", "");
                    if (myqr) {
                        //отправка pay и выход
                        switch (mobipay_navigator.getCurrentPage().name) {
                            case '':
                            case undefined:
                            case mobipayPage.auth:
                            case mobipayPage.otp:
                            case mobipayPage.pin:
                                this.options.myqrUrl = myqr;
                                this.options.isExitForUrl = true;
                                break;

                            default:
                                Backbone.trigger("WEBPassport.Views.QRScannerWidget:sendInvite", myqr, false);
                                break;
                        }
                    }
                }
                //голосование
                else if (url.indexOf("vote") > -1) {
                    var token = url.replace("news://vote-", "");
                    if (token) {
                        //отправка pay и выход
                        switch (mobipay_navigator.getCurrentPage().name) {
                            case '':
                            case undefined:
                            case mobipayPage.auth:
                            case mobipayPage.otp:
                            case mobipayPage.pin:
                                this.options.voteUrl = token;
                                this.options.isExitForUrl = true;
                                break;

                            default:
                                Backbone.trigger("WEBPassport.Views.QRScannerWidget:sendVote", token, false);
                                break;
                        }
                    }
                }
                // выставили счет (переход с пуша)
                else if (url.indexOf("p2pinvoice") > -1) {
                    var data = JSON.parse(url.replace("news://p2pinvoice-", ""));
                    if (data && data.token) {
                        switch (mobipay_navigator.getCurrentPage().name) {
                            case '':
                            case undefined:
                            case mobipayPage.auth:
                            case mobipayPage.otp:
                            case mobipayPage.pin:

                                this.options.p2pinvoiceUrl = data.token;
                                this.options.isExitForUrl = true;
                                break;

                            default:
                                Backbone.trigger("WEBPassport.Views.QRScannerWidget:sendp2pQR", data.token, false);
                                break;
                        }

                    }
                }
                // оплата в тегвей прошла успешно (переход с пуша)
                else if (url.indexOf("tagwayPaymentSuccess") > -1) {
                    Backbone.trigger('WEBPassport.Views.ModuleTagWayController:openTagWayFramePaySuccess');
                }
                // ??????
                else if (url.indexOf("qrscanner") > -1) {
                    sessionStorage.qr = true;
                    this.scanQR();
                }
            }
        },

        openMenu: function () {
            console.log("WEBPassport.Views.MainView:openMenu");
            var $this = this;
            isOpenMenu = true;

            this.ui.left_user_bar.hide();
            this.ui.right_context_bar.show();

            // важна очередность классов
            $($this.el).removeClass("effect-rotateright")
                        .removeClass("modalview")
                                  .addClass("effect-moveleft")
                                  .addClass("modalview");
            // 25ms - что бы закрытие меню не сработало (closeMenu)
            setTimeout(function () { $($this.el).addClass("animate"); }, 25);
        },
        closeMenu: function () {
            if ($(this.el).hasClass("animate")) {
                isOpenMenu = false;
                console.log("WEBPassport.Views.MainView:closeMenu");
                $(this.el).removeClass("animate");
            }
        },
        openUserMenu: function () {
            console.log("WEBPassport.Views.MainView:openUserMenu");
            var $this = this;
            isOpenMenu = true;

            // рендерим левое меню пользователя
            if (!this.userBar) {
                // привязываем вьюшку для левого бокового меню
                this.userBar = new WEBPassport.Views.UserBar({
                    el: this.ui.left_user_bar,
                    model: WEBPassport.mainViewModel,
                }).render();
            }

            this.ui.left_user_bar.show();
            this.ui.right_context_bar.hide();

            // важна очередность классов
            $($this.el).removeClass("effect-moveleft")
                        .removeClass("modalview")
                                   .addClass("effect-rotateright")
                                   .addClass("modalview");
            // 25ms - что бы закрытие меню не сработало (closeMenu)
            setTimeout(function () { $($this.el).addClass("animate"); }, 25);
        },
        renderContextMenu: function (ViewContextMenu) {
            console.log("WEBPassport.Views.MainView:renderContextMenu");
            if (this.rightContextMenu)
            {
                this.rightContextMenu.stopListening();
                this.rightContextMenu.undelegateEvents();
            }
            //  рендерим вьюшку бокового правого меню
            this.rightContextMenu = new ViewContextMenu({ el: this.ui.right_context_bar }).render();
        },
        clearAll: function () {
            console.log("WEBPassport.Views.MainView:clearAll");

            this.stopListening();
            this.undelegateEvents();
        },
        // отслеживание url
        handleURL: function (data) {
            console.log("WEBPassport.Views.MainView:handleURL data:" + data ? JSON.stringify(data) : "");
            if (data.url) {
                this.sendFromLink(data.url);
            }
        },

        updatePushHistory: function (data) {
            console.log("WEBPassport.Views.MainView:updatePushHistory data:" + data ? JSON.stringify(data) : "");
            window.plugins.updatenotification.updateNotifications(data.token, function () { console.log('pushes updated') }, function () { console.log('push update error') });
        },

        updateNotifications: function () {
            console.log("WEBPassport.Views.MainView:updateNotifications");

            if (this.model.get('state') == 'main') {
                plugins.appPreferences.fetch(this.onFetchPushSuccess, function () { }, 'push');
            }
        },

        onFetchPushSuccess: function (str) {
            console.log("WEBPassport.Views.MainView:onFetchPushSuccess str:" + str);
            try {
                var invoices = 0;
                //var p2pCard=1;
                var p2pInvoice = 0;
                var jsonPushes = JSON.parse(str);
                console.log(jsonPushes);
                for (var i = 0, len = jsonPushes.length; i < len; i++) {
                    if (jsonPushes[i].type == 'invoice') {
                        invoices++;
                    }
                    /*if(jsonPushes[i].type=='p2p'||jsonPushes[i].type=='p2p3D'){
                        p2pCard++;
                    }*/
                    if (jsonPushes[i].type == 'p2p.invoice') {
                        p2pInvoice++;
                    }
                }
                console.log(invoices);
                if (invoices > 0) {
                    $('#invoices-btn').iosbadge({ theme: 'red', size: 22, content: invoices });
                }
                /*if(p2pCard>0){
                    $('#cards-btn').iosbadge({ theme: 'red', size: 22, content:p2pCard });
                }*/
                /*if(p2pInvoice>0){
                    $('#p2p-btn').iosbadge({ theme: 'red', size: 22, content:p2pInvoice });
                }*/
            }
            catch (e) {
                console.log(e);
            }
        },
    });

    // вьюшка левого бара ( UserBAR, мини холодильк, пивас =) )
    WEBPassport.Views.UserBar = Marionette.ItemView.extend({
        template: '#template_menu_profile',
        ui: {
            user_menu_exit: "#user_menu_exit", // кнопка ВЫЙТИ
            sign_in_another_account: "#sign_in_another_account", // кнопка "Войти под другим аккаунтом"
            to_invite_friend: "#to_invite_friend", // кнопка ПРИГЛАСИТЬ ДРУГА
            user_menu_settings: "#user_menu_settings", // кнопка НАСТРОЙКИ
            user_menu_my_card: "#user_menu_my_card", // кнопка МОИ КАРТЫ
            user_menu_edit: "#user_menu_edit", // кнопка РЕДАКТИРОВАТЬ
            user_menu_upploau_photo: "#user_menu_upploau_photo", // кнопка обновить фото
            user_mobile: "#user_mobile", // номер телефона
            user_chat: "#user_chat",
            send_feedback: "#send_feedback", // кнопка "отправить отчет о работе приложения"
        },
        events: {
            'click @ui.user_menu_exit': 'exitApp', // клик на кнопку ВЫЙТИ
            'click @ui.sign_in_another_account': 'signInWithAnotherAccount', // клик на кнопку "Войти под другим аккаунтом"
            'click @ui.to_invite_friend': 'inviteFriend', // клик на кнопку ПРИГЛАСИТЬ ДРУГА
            'click @ui.user_menu_settings': 'goToSettings', // клик на кнопку НАСТРОЙКИ
            'click @ui.user_menu_my_card': 'goToMyCart', // клик на кнопку МОИ КАРТЫ
            'click @ui.user_menu_edit': 'editUserData', // клик на кнопку РЕДАКТИРОВАТЬ
            'click @ui.user_chat': 'userChat', // клик на кнопку РЕДАКТИРОВАТЬ
            'click @ui.send_feedback': 'sendFeedback', // клик на кнопку "отправить отчет о работе приложения"
            //'click @ui.user_menu_upploau_photo': 'updatePhoto', // клик на кнопку обновить фото
        },
        initialize: function () {
            console.log("WEBPassport.Views.UserBar:initialize");

            // для уничтожения полностью дашборда
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:clearAll', this.clearAll);

           // this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:signInWithAnotherAccount', this.signInWithAnotherAccount);
            this.bindUIElements();
        },
        onRender: function () {
            console.log("WEBPassport.Views.UserBar:onRender");
            if (this.model.attributes.mobile) {
                var result = listMaskPhone.getMaskForPhoneNumber(this.model.attributes.mobile);

                this.ui.user_mobile.text(this.model.attributes.mobile);
                this.ui.user_mobile.mask(result.mask, { 'translation': { x: { pattern: /[0-9]/ } } });
            }

            if (isMobile && device.platform.toLowerCase() == 'ios')
                this.ui.user_menu_exit.hide();

            if (!WEBPassport.Views.MyCards)
                this.ui.user_menu_my_card.hide();

            if (wlPath == "DreamClub")
                this.ui.to_invite_friend.hide();

            this.$el.i18n();
        },
        // клик на кнопку ВЫЙТИ
        exitApp: function () {
            console.log("WEBPassport.Views.UserBar:exitApp");
            // TODO: сделать предупреждение
            stopListenSMS();
            if (navigator && navigator.app) {
                navigator.app.exitApp();
            }
            else {
                if (navigator && navigator.device) {
                    navigator.device.exitApp();
                }
            }
        },
        // клик на кнопку "Войти под другим аккаунтом"
        signInWithAnotherAccount: function () {
            console.log("WEBPassport.Views.UserBar:signInWithAnotherAccount");
            // TODO: сделать предупреждение

            // как попали в дашборд, html вюшки "PIN" удален, но js объект не удален
            // по этому можем пользоватся его функциями
            // сменить аккаунт
            ShowConfirm(i18n.t('wbs_relogin_label') + " ?", function (idx) {
                switch (idx) {
                    case 1:
                        Backbone.trigger('WEBPassport.Views.PIN:resetPinBefore');
                        break;
                }
            }, [i18n.t('wbs_yes_btn'), i18n.t('wbs_no_btn')]);


        },
        // клик на кнопку ПРИГЛАСИТЬ ДРУГА
        inviteFriend: function () {
            console.log("WEBPassport.Views.UserBar:inviteFriend");

            if (isMobile) {
                window.plugins.socialsharing.share(
                    null,
                    wlPath + " invite",
                    null,
                    getInviteLink(),
                    function (result) { console.log('WEBPassport.Views.UserBar:inviteFriend result: ' + result) },
                    function (result) { alert('WEBPassport.Views.UserBar:inviteFriend error: ' + result); }
                );
            }
            else
                ShowAlert(WEBPassport.mainViewModel.get('invite'));

        },
        // клик на кнопку НАСТРОЙКИ
        goToSettings: function () {
            console.log("WEBPassport.Views.UserBar:goToSettings");

            var backgroundColor = $($(".widget_settings_2_2")[0]).css("background-color");
            backgroundColor = backgroundColor ? backgroundColor : $($(".widget")[0]).css("background-color");
            mobipayNavigatorOpen(
                  mobipayPage.settings,
                  "left",
                  { backgroundColor: backgroundColor }
              );
        },
        // клик на кнопку МОИ КАРТЫ
        goToMyCart: function () {
            console.log("WEBPassport.Views.UserBar:goToMyCart");
            setTimeout(function () {

                var backgroundColor = $($(".widget_my_cards_2_2")[0]).css("background-color");
                backgroundColor = backgroundColor ? backgroundColor : $($(".widget")[0]).css("background-color");

                mobipayNavigatorOpen(mobipayPage.mycards,
                       "left",
                       { backgroundColor: backgroundColor }
                   );
            }, timeoutAnimate);

        },
        // клик на кнопку РЕДАКТИРОВАТЬ
        editUserData: function () {
            console.log("WEBPassport.Views.UserBar:editUserData");
            setTimeout(function () {
                var backgroundColor = $($(".widget_WebPassport_2_2")[0]).css("background-color");
                backgroundColor = backgroundColor ? backgroundColor : $($(".widget")[0]).css("background-color");

                if (wlPath == "DreamClub") {
                    mobipayNavigatorOpen(mobipayPage.webpassport_dreamclub, "left",
                           { backgroundColor: backgroundColor }
                       );
                }
                else {
                    mobipayNavigatorOpen(mobipayPage.webpassport, "left",
                           { backgroundColor: backgroundColor }
                       );
                }

            }, timeoutAnimate);
        },
        userChat: function () {
            console.log("WEBPassport.Views.UserBar:userChat");
            setTimeout(function () {
                Backbone.trigger('WEBPassport.Views.ModuleTelegramController:openFrame');
            }, timeoutAnimate);
        },
        clearAll: function () {
            console.log("WEBPassport.Views.UserBar:clearAll");

            this.stopListening();
            this.undelegateEvents();
        },
        // клик на кнопку "отправить отчет о работе приложения"
        sendFeedback: function () {
            console.log("WEBPassport.Views.UserBar:sendFeedback");
            Backbone.trigger('WEBPassport.Views.DialogFeedbackError:FeedbackError');
        },
    });



    WEBPassport.Views.mainView = new WEBPassport.Views.MainView({ model: new Backbone.Model() });
});

typeWidget = new Object();


// При добалвении виджета необходимо:
//1 - добавить его в baseTypeWidget
//2 - www\js\views\dashboard\widgets\ добавть js виджета  view-widget-name.js
// ---- ВАЖНО! name - должен быть одинаковый!!! -----
//3 - www\js\views\screens\ добавть js страницы view-screen-name.js
//4 - в конфигурации гранта нужно добавить в массив defaultWidgets name
//5 - в www\js\views\dashboard\view-dashboard.js во вьюшке WEBPassport.Views.Dashboard в метод createWidget
// добавит карту для создание виджета
//6 - в www\js\views\mobipay_navigator.controller.js добавить записи по анологии
//7 - в шаблонах создать разметку имя html шаблона ставим таким же как и name


// типы виджетов
baseTypeWidget = {
    WebPassport: {
        name: "WebPassport",
        urlIcon: "fa icon-web-pasport",
        tittle: function () { return i18n.t("wbs_passports_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    }, //"Web паспорт",
    MyCards: {
        name: "MyCards",
        urlIcon: "fa icon-mycards",
        tittle: function () { return i18n.t("wbs_my_cards"); },
        max_size: [, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    }, //"Мои карты",
    Wallet: {
        name: "Wallet",
        urlIcon: "fa icon-monexy",
        tittle: function () { return i18n.t("wbs_wallet"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 3,
        size_y: 2,
    }, //"кошелек",
    Invoices: {
        name: "Invoices",
        urlIcon: "fa icon-invoices",
        tittle: function () { return i18n.t("wbs_invoices_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 3,
        size_y: 2,
    }, //"Счета",
    InvoicesQRPOS: {
        name: "InvoicesQRPOS",
        urlIcon: "fa icon-invoices",
        tittle: function () { return i18n.t("wbs_invoices_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 3,
        size_y: 2,
    }, //"Счета QRPOS",
    Loyalty: {
        name: "Loyalty",
        urlIcon: "fa icon-loyalty",
        tittle: function () { return i18n.t("wbs_loyalty_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    }, //"Лояльность",
    P2PcardToCard: {
        name: "P2PcardToCard",
        urlIcon: "fa icon-p2pcard-to-card",
        tittle: function () { return i18n.t("wbs_p2p_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"P2P с карты на карту",
    PromotionsAndOffers: {
        name: "PromotionsAndOffers",
        urlIcon: "fa icon-promotions-and-offers",
        tittle: function () { return i18n.t("wbs_promotions_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Акции и предложения",
    Credit: {
        name: "Credit",
        urlIcon: "fa icon-credits",
        tittle: function () { return i18n.t("wbs_credit_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Кредит",
    Services: {
        name: "Services",
        urlIcon: "fa icon-services",
        tittle: function () { return i18n.t("wbs_tickets_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Услуги",
    E_Policies: {
        name: "E_Policies",
        urlIcon: "fa icon-epolicy",
        tittle: function () { return i18n.t("wbs_epolicy_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Е-Полисы",
    AZS: {
        name: "AZS",
        urlIcon: "fa icon-azs",
        tittle: function () { return i18n.t("wbs_azs_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"АЗС",
    RefillMobilePhone: {
        name: "RefillMobilePhone",
        urlIcon: "fa icon-refill-mobile-phone",
        tittle: function () {
            switch(wlPath){
                case "TripWallet":{
                    return i18n.t("wbs_refill_mobile_phone");
                    break;
                }
                default:{
                    return i18n.t("wbs_deposit_with_no_commission");
                    break;
                }
            }
        },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Пополнить моб телефон",
    MyQR: {
        name: "MyQR",
        urlIcon: "fa icon-my-qr",
        tittle: function () { return i18n.t("wbs_my_qr_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 3,
        size_y: 3,
    },//"Мой QR",
    MyQRQRPOS: {
        name: "MyQRQRPOS",
        urlIcon: "fa icon-my-qr",
        tittle: function () { return i18n.t("wbs_my_qr_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 3,
        size_y: 3,
    },//"Мой QR QRPOS",
    QRScanner: {
        name: "QRScanner",
        urlIcon: "fa icon-scan-qr",
        tittle: function () { return i18n.t("wbs_scan_qr_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 3,
        size_y: 3,
    },//"Сканер QR",
    Coupons: {
        name: "Coupons",
        urlIcon: "fa icon-coupons",
        tittle: function () { return i18n.t("wbs_coupons"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Купоны",
    Presents: {
        name: "Presents",
        urlIcon: "fa icon-presents",
        tittle: function () { return i18n.t("wbs_gifts"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Подарки",
    BalanceCard: {
        name: "BalanceCard",
        urlIcon: "fa icon-wallet",
        tittle: function () { return i18n.t("wbs_balance_card"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Баланс карты (баланс банковской карты)",
    Settings: {
        name: "Settings",
        urlIcon: "fa icon-setting",
        tittle: function () { return i18n.t("wbs_settings"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Настройки ",
    Pager: {
        name: "Pager",
        urlIcon: "fa icon-pager",
        tittle: function () { return i18n.t("wbs_pager"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Пейджер ",
    Assistant: {
        name: "Assistant",
        urlIcon: "fa icon-assist",
        tittle: function () { return i18n.t("wbs_assistant"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Ассистент ",
    LoyaltyFoxtrot: {
        name: "LoyaltyFoxtrot",
        urlIcon: "fa icon-foxtrot",
        tittle: function () { return i18n.t("wbs_bonuses"); },
        max_size: [6, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    }, //"Лояльность Foxtrot",
    Telegram: {
        name: "Telegram",
        urlIcon: "fa icon-telegram1",
        tittle: function () { return  i18n.t("wbs_chat"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Telegram",
    CreateInvoice: {
        name: "CreateInvoice",
        urlIcon: "fa icon-create-invoice",
        tittle: function () { return i18n.t("wbs_new_invoice_label");},
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Выставить счет",
    CreateInvoiceQRPOS: {
        name: "CreateInvoiceQRPOS",
        urlIcon: "fa icon-create-invoice",
        tittle: function () { return i18n.t("wbs_new_invoice_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Выставить счет QRPOS",
    CreditFox: {
        name: "CreditFox",
        urlIcon: "fa icon-credits",
        tittle: function () { return i18n.t("wbs_credit_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Кредит Foxtrot"
    PaymentsLifecell: {
        name: "PaymentsLifecell",
        urlIcon: "fa icon-payments",
        tittle: function () { return i18n.t("wbs_payments"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    }, // платежи для Lifecell
    Maxicard: {
        name: "Maxicard",
        urlIcon: "fa icon-maxi",
        tittle: function () { return "Maxicard"; },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    }, // Maxicard
    Help: {
        name: "Help",
        urlIcon: "fa icon-halp",
        tittle: function () { return "Help"; },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    }, // HalpFox
    Support: {
        name: "Support",
        urlIcon: "fa icon-feedback",
        tittle: function () { return "Support"; },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    }, // Support
    PromotionsAndOffersDreamclub: {
        name: "PromotionsAndOffersDreamclub",
        urlIcon: "fa icon-promotions-and-offers",
        tittle: function () { return i18n.t("wbs_promotions"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Акции и предложения для DREAMCLUB",
    Partners: {
        name: "Partners",
        urlIcon: "fa icon-roaming",
        tittle: function () { return "Партнеры" },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Партнеры",
    BalancePromo: {
        name: "BalancePromo",
        urlIcon: "fa icon-promocode1",
        tittle: function () { return "Ваши промо коды"; },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },// баланс промо акций
    ActivateBalancePromo: {
        name: "ActivateBalancePromo",
        urlIcon: "fa icon-activate-code",
        tittle: function () { return "Активировать код"; },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },// баланс промо акций
    BalanceBonuses: {
        name: "BalanceBonuses",
        urlIcon: "fa icon-loyalty",
        tittle: function () { return "Бонусный счет"; },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },// баланс бонусов
    MyQRDreamClub: {
        name: "MyQRDreamClub",
        urlIcon: "fa icon-my-qr",
        tittle: function () { return i18n.t("wbs_my_qr_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 3,
        size_y: 3,
    },//"Мой QR DreamClub",
    QRScannerDreamClub: {
        name: "QRScannerDreamClub",
        urlIcon: "fa icon-scan-qr",
        tittle: function () { return i18n.t("wbs_scan_qr_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 3,
        size_y: 3,
    },//"Сканер QR DreamClub",
    WebPassportDreamClub: {
        name: "WebPassportDreamClub",
        urlIcon: "fa icon-web-pasport",
        tittle: function () { return i18n.t("wbs_passports_label"); },
        max_size: [6, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    }, //"Web паспорт DreamClub",
    DreamClub: {
        name: "DreamClub",
        urlIcon: "fa icon-dreamclub",
        tittle: function () { return "DreamClub"; },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    }, //"DreamClub",
    Deposit: {
        name: "Deposit",
        urlIcon: "fa icon-deposits",
        tittle: function () { return i18n.t("wbs_deposits"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Депозит",
    AcceptPaymentQRPOS: {
        name: "AcceptPaymentQRPOS",
        urlIcon: "fa icon-credits",
        tittle: function () { return i18n.t("wbs_accept_payment_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Депозит",
    QRScannerQRPOS: {
        name: "QRScannerQRPOS",
        urlIcon: "fa icon-scan-qr",
        tittle: function () { return i18n.t("wbs_scan_qr_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 3,
        size_y: 3,
    },//"Сканер QR",
    Users: {
        name: "Users",
        urlIcon: "fa icon-friends",
        tittle: function () { return i18n.t("wbs_users_label"); },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Пользователи",
    TransferBonuses: {
        name: "TransferBonuses",
        urlIcon: "fa icon-transfer-bonuses",
        tittle: function () { return "перевести бонусы" },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
    },//"Перевести бонусы ( дрим клаб )",

	// CHANGES#RESMI
	Gifts: {
		name: "Gifts",
        urlIcon: "fa icon-promocode1",
        tittle: function () { return "Обменять на подарки" },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
	},
	// CHANGES#RESMI
	MyWallets: {
		name: "MyWallets",
        urlIcon: "fa icon-promocode1",
        tittle: function () { return "Мои кошельки" },
        max_size: [3, 4],
        min_size: [2, 2],
        size_x: 2,
        size_y: 2,
	}
};

// получить настройки(функционала) виджета
// если не находим настройки в кеше то возвращаем стандартные
function getWSettings(model) {
    console.log("view-widgets:getWSettings model:" + model ? JSON.stringify(model) : "");
    var result;
    var array;

    if (localStorage[settingWidgetCache])
        array = JSON.parse(localStorage[settingWidgetCache]);
    else
        array = new Array();

    // настройки в кеше ищем
    array.forEach(function (a) {
        if (a.id == model.id) {
            result = a.settings;
            return false;
        }
    });

    // если нашли настройки возвращаем
    if (result)
        return result;

    // если настроек нету возвращаем стандартные
    var item = {
        id: model.id,
    };

    switch (baseTypeWidget[model.type.name].name) {
        case baseTypeWidget.Wallet.name:
            item.settings = {
                updateInterval: 60000, // интервал обновления
            }
            break;
        case baseTypeWidget.Loyalty.name:
            item.settings = {
                updateInterval: 60000, // интервал обновления
            }
            break;
        case baseTypeWidget.BalancePromo.name:
            item.settings = {
                updateInterval: 60000, // интервал обновления
            }
            break;

		// CHANGES#RESMI
        case baseTypeWidget.Gifts.name:
            item.settings = {
                updateInterval: 60000, // интервал обновления
            }
            break;
        case baseTypeWidget.MyWallets.name:
            item.settings = {
                updateInterval: 60000, // интервал обновления
            }
            break;

        default:
            break;
    }

    // сохраняем
    array.push(item);
    localStorage[settingWidgetCache] = JSON.stringify(array);

    return item.settings;
}

// сохраняем настройки(функционала) виджета
function saveWSettings(id, settings) {
    console.log("view-widgets:getWSettings id:" + id + " settings:" + settings ? JSON.stringify(settings) : "");
    var result;
    var array;

    if (localStorage[settingWidgetCache])
        array = JSON.parse(localStorage[settingWidgetCache]);
    else
        array = new Array();

    // настройки в кеше ищем
    array.forEach(function (a) {
        if (a.id == id) {
            result = a.settings = settings;
            return false;
        }
    });

    if (!result)
        array.push({ id: id, settings: settings });

    // сохраняем
    localStorage[settingWidgetCache] = JSON.stringify(array);
}

ons.ready(function () {

    // собираем доступные виджеты
    var newTypeString = '{';
    $.each(baseTypeWidget, function (i, w) {
        var isAdd = false;
        var addWidget = 'if(WEBPassport.Views.' + i + 'Widget){ isAdd = true;}';
        eval(addWidget);
        if (isAdd)
            newTypeString += '"' + i + '":' + JSON.stringify(w) + ',';
    });
    typeWidget = JSON.parse(newTypeString.slice(0, -1) + '}');

    $.each(typeWidget, function (i, w) {
        w.tittle = baseTypeWidget[i].tittle;
    });

    // вьюшка для меню виджетов
    // идея в том что все возможные меню будут в этой вьюшке, а в showItemForTypeWidget
    // определим какой пункт доступен для какого типа виджета
    WEBPassport.Views.DialogMenuWidget = Marionette.ItemView.extend({
        ui: {
            item_update: '#item_update', // кнопка Обновить
            item_settings: '#item_settings', // кнопка Настройки
            item_delete: '#item_delete', // кнопка Удалить
        },
        initialize: function () {
            console.log("WEBPassport.Views.DialogMenuWidget:initialize");

            // показать меню
            this.listenTo(Backbone, 'WEBPassport.Views.DialogMenuWidget:dialogShow', this.dialogShow);

            this.bindUIElements();
        },
        events: {
            "click @ui.item_update": "updateWidget", // клик на кнопка Обновить
            "click @ui.item_settings": "settingsWidget", // клик на кнопка Настройки
            "click @ui.item_delete": "deleteConfirm", // клик на кнопка Удалить
        },
        // клик на кнопка Обновить
        updateWidget: function () {
            console.log("WEBPassport.Views.DialogMenuWidget:updateWidget: " + this.attributesWidget.id);
            // Обновить виджет
            Backbone.trigger('WEBPassport.Views.IWidget:updateWidget' + this.attributesWidget.id);
            // после выбора скрываем менюшку
            Backbone.trigger('WEBPassport.Views.Dashboard:dialogHide');
        },
        // клик на кнопка Настройки
        settingsWidget: function () {
            console.log("WEBPassport.Views.DialogMenuWidget:settingsWidget: " + this.attributesWidget.id);
            // Настройки виджета
            Backbone.trigger('WEBPassport.Views.IWidget:settingsWidget' + this.attributesWidget.id);
            // после выбора скрываем менюшку
            Backbone.trigger('WEBPassport.Views.Dashboard:dialogHide');
        },
        // клик на кнопка Удалить
        deleteConfirm: function () {
            console.log("WEBPassport.Views.DialogMenuWidget:deleteConfirm: " + this.attributesWidget.id);
            // удаляем виджет
            Backbone.trigger('WEBPassport.Views.IWidget:deleteWidget' + this.attributesWidget.id);
            // после выбора скрываем менюшку
            Backbone.trigger('WEBPassport.Views.Dashboard:dialogHide');
        },
        // показать меню
        dialogShow: function (attributes) {
            console.log("WEBPassport.Views.DialogMenuWidget:dialogShow: " + attributes.id);

            // сохраняем атрибуты
            this.attributesWidget = attributes;
            // вкл / выкл - пункты меню в зависимости от типа виджета
            this.showItemForTypeWidget();
        },
        // вкл / выкл - пункты меню в зависимости от типа виджета
        showItemForTypeWidget: function () {
            console.log("WEBPassport.Views.DialogMenuWidget:showItemForTypeWidget");
            this.ui.item_update.show();
            this.ui.item_settings.show();
            this.ui.item_delete.show();

            switch (baseTypeWidget[this.attributesWidget.type.name].name) {
                case baseTypeWidget.MyQR.name:
                case baseTypeWidget.QRScanner.name:
                    this.ui.item_settings.hide();
                    this.ui.item_update.hide();
                    this.ui.item_delete.hide();
                    break;
                default:
                    this.ui.item_settings.hide();
                    this.ui.item_update.hide();
                    break;
            }
        }
    });

});
ons.ready(function () {
    // флак для состояния дашборда ( режим редактирования или нет)
    window.isEditDashboard = false;

    //  вьюшка бокового правого меню для дашборда
    WEBPassport.Views.DashboardMenu = Marionette.ItemView.extend({
        template: "#template-dashboard-menu",
        ui: {
            dashboard_edit: "#dashboard_edit", // кнопка редактирования
            dashboard_save: "#dashboard_save", // кнопка сохранить
            dashboard_cancel: "#dashboard_cancel", // кнопка отменить изменения
            dashboard_remove_settings: "#dashboard_remove_settings", // кнопка удалить изменения
            dashboard_add_list: "#dashboard_add_list", // кнопка добавить страницу для карусели
            dashboard_add_widget: "#dashboard_add_widget", // кнопка добавить виджет
            row_child_edit: "#row_child_edit", // дочерние пункты кнопки "редактирования"
            send_feedback: "#send_feedback", // кнопка "отправить отчет о работе приложения"
        },
        events: {
            "click @ui.dashboard_edit": "dashboardEdit", // клик по кнопка редактирования
            "click @ui.dashboard_save": "dashboardSave", // клик по кнопка сохранить
            "click @ui.dashboard_cancel": "dashboardCancel", // клик по кнопка отменить изменения
            "click @ui.dashboard_remove_settings": "dashboardRemoveSettings", // клик по кнопка удалить изменения
            "click @ui.dashboard_add_list": "dashboardAddList", // клик по кнопка добавить страницу для карусели
            "click @ui.dashboard_add_widget": "dashboardAddWidget", // клик по кнопка добавить виджет
            'click @ui.send_feedback': 'sendFeedback', // клик на кнопку "отправить отчет о работе приложения"
        },
        initialize: function () {
            console.log("WEBPassport.Views.DashboardMenu:initialize");
            // для уничтожения полностью дашборда
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:clearAll', this.clearAll);

            // сохранить
            this.listenTo(Backbone, 'WEBPassport.Views.DashboardMenu:dashboardSave', this.dashboardSave);
            // отменить изменения
            this.listenTo(Backbone, 'WEBPassport.Views.DashboardMenu:dashboardCancel', this.dashboardCancel);

            // включаем редактирование гридстера
            this.listenTo(Backbone, 'WEBPassport.Views.DashboardMenu:dashboardEdit', this.dashboardEdit);
            this.bindUIElements();
        },
        onRender: function () {
            console.log("WEBPassport.Views.DashboardMenu:onRender");

            // если выключен режим редактия скрываем меню Сохранить / отменить
            if (!isEditDashboard) {
                this.ui.row_child_edit.hide();
            }

            ons.compile(this.$el.get(0));
            this.$el.i18n();
        },
        // включить признак редактирования и показать пункты меню Сохранить / отменить
        modEditOnn: function () {
            console.log("WEBPassport.Views.DashboardMenu:modEditOnn");
            isEditDashboard = true;
            this.ui.row_child_edit.show(300);
        },
        // выключить признак редактирования и скрыть пункты меню Сохранить / отменить
        modEditOff: function () {
            console.log("WEBPassport.Views.DashboardMenu:modEditOff");
            isEditDashboard = false;
            this.ui.row_child_edit.hide(300);
        },
        // клик по кнопка редактирования
        dashboardEdit: function () {
            console.log("WEBPassport.Views.DashboardMenu:dashboardEdit");
            var $this = this;
            setTimeout(function () {
                $this.modEditOnn();
                // включаем редактирование гридстера
                Backbone.trigger('WEBPassport.Views.Dashboard:showBtnsFuncEdit');
                Backbone.trigger('WEBPassport.Views.CarouselDashboardItemView:gridsterEnableEdit');
                if (window.settings.isEffects)
                    $(".widget").removeClass("effects");

            }, timeoutAnimate);
        },
        // клик по кнопка сохранить
        dashboardSave: function (timeoutOff) {
            console.log("WEBPassport.Views.DashboardMenu:dashboardSave");

            this.modEditOff();
            setTimeout(function () {
                // сохраняем настройки
                Backbone.trigger('WEBPassport.Views.Dashboard:saveDashboard');
            }, timeoutOff == true ? 0 : timeoutAnimate);
        },
        // клик по кнопка отменить изменения
        dashboardCancel: function (timeoutOff) {
            console.log("WEBPassport.Views.DashboardMenu:dashboardCancel");
            var $this = this;
            setTimeout(function () {
                // показываем сообщение
                //i18n.t("tagway_lang_are_you_sure_you_want_delete_ticket")
                ShowConfirm(i18n.t('wbs_want_discard_changes'), function (idx) {
                    switch (idx) {
                        case 0:
                            break;
                        case 1:
                            $this.modEditOff();
                            // отменяем изменения
                            Backbone.trigger('WEBPassport.Views.Dashboard:cancelDashboard');
                            break;
                    }
                }, [i18n.t('wbs_yes_btn'), i18n.t('wbs_no_btn')]);

            }, timeoutOff == true ? 0 : timeoutAnimate);
        },
        // клик по кнопка удалить изменения
        dashboardRemoveSettings: function () {
            console.log("WEBPassport.Views.DashboardMenu:dashboardRemoveSettings");
            var $this = this;

            setTimeout(function () {
                ShowConfirm(i18n.t('wbs_want_reset_dashboards'), function (idx) {
                    switch (idx) {
                        case 1:
                            $this.modEditOff();
                            Backbone.trigger('WEBPassport.Views.Dashboard:removeSettings');
                            break;
                    }
                }, [i18n.t('wbs_yes_btn'), i18n.t('wbs_no_btn')]);
            }, timeoutAnimate);
        },
        // клик по кнопка добавить страницу для карусели
        dashboardAddList: function () {
            console.log("WEBPassport.Views.DashboardMenu:dashboardAddList");
            setTimeout(function () {
                ShowAlert(i18n.t('wbs_functional_development'));
            }, timeoutAnimate);
            //this.modEditOff();
            //// добавить новую страницу для карусели
            //Backbone.trigger('WEBPassport.Views.Dashboard:addSlideToCarusel');
        },
        // клик по кнопка добавить виджет
        dashboardAddWidget: function () {
            console.log("WEBPassport.Views.DashboardMenu:dashboardAddWidget");
            setTimeout(function () {
                Backbone.trigger('WEBPassport.Views.Dashboard:dialogAddWidgetShow');
            }, timeoutAnimate);
        },
        // клик на кнопку "отправить отчет о работе приложения"
        sendFeedback: function () {
            console.log("WEBPassport.Views.DashboardMenu:sendFeedback");
            Backbone.trigger('WEBPassport.Views.DialogFeedbackError:FeedbackError');
        },

        clearAll: function () {
            console.log("WEBPassport.Views.DashboardMenu:clearAll");

            this.stopListening();
            this.undelegateEvents();
        }
    });

    // вьюшка дашборда
    WEBPassport.Views.Dashboard = Marionette.ItemView.extend({
        el: "#page_dashboard",
        template: '#template_dashboard_content',
        ui: {
            caruselDashboard: "#caruselDashboard", // блок размещения карусели
            headerMenu: "#headerMenu", // кнопка вызова меню (справа)
            dotstyle: "#dotstyle", // точки навигации карусели
            userMenuBar: "#userMenuBar", // кнопка для  открытия пользовательского бара
            save_btn: "#save-btn", //
            cancel_btn: "#cancel-btn",
            btns_func_edit: "#btns_func_edit",
            headerTelegram: "#headerTelegram"
        },
        events: {
            "click .popovershow": "showPopover",  //обработка клика
            "click @ui.headerMenu": "openMenu",   // клик по меню (справа) открыть
            "click @ui.userMenuBar": "openUserMenu", // клик по кнопке для открытия пользовательского бара
            'click @ui.save_btn': "clickSaveFunc",
            'click @ui.cancel_btn': "clickCancelFunc",
            'click @ui.headerTelegram': "clickheaderTelegram", //  клик на телеграм (для дрима)
        },
        initialize: function () {
            console.log("WEBPassport.Views.Dashboard:initialize");
            // отключаем событие инизиализации страницы
            $(document).off('pageinit', 'ons-page#page_dashboard');

            // отменить изменения виджетов
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:cancelDashboard', this.cancelDashboard);
            // сохранить изменения виджетов
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:saveDashboard', this.saveDashboard);

            // выключить редактирование виджетов
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:gridsterDisableEdit', this.gridsterDisableEdit);

            // включить листание карусели
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:caruselEnable', this.caruselEnable);
            // выключить листание карусели
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:caruselDisable', this.caruselDisable);

            // добавить новую страницу для карусели
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:addSlideToCarusel', this.addSlideToCarusel);

            // показать меню виджета
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:dialogShow', this.dialogShow);
            // скрыть меню виджета
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:dialogHide', this.dialogHide);

            // показать меню на добавления виджетов
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:dialogAddWidgetShow', this.dialogAddWidgetShow);
            // скрыть меню на добавления виджетов
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:dialogAddWidgetHide', this.dialogAddWidgetHide);

            // создание вьюшки/обработчки виджета
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:createWidget', this.createWidget);

            // TODO: тестовый функционал
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:goToDemo', this.goToDemo);

            //сбросить настройки дашборда
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:removeSettings', this.removeSettings);

            // выход с приложения
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:returnToExit', this.returnToExit);

            // для уничтожения полностью дашборда
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:destroyAll', this.destroyAll);

            // показать кнопки для редактирования
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:showBtnsFuncEdit', this.showBtnsFuncEdit);

            //  рендерим вьюшку бокового правого меню
            Backbone.trigger('WEBPassport.Views.MainView:renderContextMenu', WEBPassport.Views.DashboardMenu);

            _.bindAll(this, 'toastSuccess', 'onPendingExit');

            this.bindUIElements();
        },
        onRender: function () {
            console.log("WEBPassport.Views.Dashboard:onRender");
            var $this = this;

            ons.compile($this.$el.get(0));
            if (isBusiness) this.ui.userMenuBar.hide();

            var array = new Array();

            // загружаем виджеты из настроек, если первый запуска то загружаем по станадртной схеме
            if (window.settings.dashboard && window.settings.dashboardId == settingsDashboard) {
                array = window.settings.dashboard;
                // функции не сереализует =(
                // перезаписываем ограничения размеров ( вдруг настройки сохранены а у нас шаблоны изменились)

                array.forEach(function (a) {
                    a.widgets.forEach(function (w, i) {
                        if (typeWidget[w.type.name]) {// если виджет доступен
                            w.type.tittle = typeWidget[w.type.name].tittle;
                            w.type.urlIcon = typeWidget[w.type.name].urlIcon;
                            w.type.max_size = typeWidget[w.type.name].max_size;
                            w.type.min_size = typeWidget[w.type.name].min_size;
                        }
                    });
                });
            }
            else
                array = getStandartShema();

            if ($this.carouselDashboardCollectionView)
                $this.carouselDashboardCollectionView.collection.reset();

            // рендерим страницы карусели и виджеты на ней
            $this.carouselDashboardCollectionView = new WEBPassport.Views.CarouselDashboardCollectionView({
                collection: new Backbone.Collection(array),
                el: $this.ui.caruselDashboard
            }).render();

            // добавляем точки для отображения текущей страницы
            array.forEach(function (a) {
                $($this.ui.dotstyle).find("ul").prepend('<li class=""><a></a></li>');
            });
            // отмечаем первую точку
            $($($this.ui.dotstyle).find("li")[0]).addClass("current");

            // создание меню для виджетов
            ons.createDialog('template-dialog-menu-widget').then(function (dialog) {
                dialog.getDeviceBackButtonHandler().disable();
                $this.dialog = dialog;
                WEBPassport.Views.dialogMenuWidget = new WEBPassport.Views.DialogMenuWidget({ el: $this.dialog._element[0] });
                WEBPassport.Views.dialogMenuWidget.$el.i18n();
            });

            // вешаем событие для скролинка карусели, что бы отметить точку на которой мы находимся
            caruselDashboard.on("postchange", function (a) {
                console.log("activeIndex: " + a.activeIndex);
                $($($this.ui.dotstyle).find("li")).removeClass("current");
                $($($this.ui.dotstyle).find("li")[a.activeIndex]).addClass("current");
            });

           // ons.compile($this.$el.get(0));
            ShowLoader();
            setTimeout(function () {
                HideLoader();
            }, 1000);

            this.options.pendingTime = 2000;
        },
        // выход с приложения
        returnToExit: function () {
            console.log("WEBPassport.Views.Dashboard:returnToExit");
            //если открыт фрейм модуля отправлем ему event BackButton
            if (WEBPassport.Views.moduleTagWayController && WEBPassport.Views.moduleTagWayController.isShowModule) {
                Backbone.trigger('WEBPassport.Views.ModuleTagWayController:sendToIframeBackButton');
                return;
            }
            else if (WEBPassport.Views.moduleTelegramController && WEBPassport.Views.moduleTelegramController.isShowModule) {
                Backbone.trigger('WEBPassport.Views.ModuleTelegramController:sendToIframeBackButton');
                return;
            }


            if (isOpenMenu) {
                Backbone.trigger('WEBPassport.Views.MainView:closeMenu');
                return;
            }

            if (this.dialog.isShown()) {
                this.dialog.hide();
                return;
            }

            if (this.addWidgetDialog && this.addWidgetDialog.isShown()) {
                this.addWidgetDialog.hide();
                return;
            }

            if (this.options.pendingExit) {
                stopListenSMS();
                if (navigator && navigator.app) {
                    navigator.app.exitApp();
                }
                else {
                    if (navigator && navigator.device) {
                        navigator.device.exitApp();
                    }
                }
            }
            else {
                window.plugins.toast.show(i18n.t("wbs_exit_msg"), 'short', 'bottom', this.toastSuccess, null);
            }
        },
        toastSuccess: function () {
            console.log("WEBPassport.Views.Dashboard:toastSuccess");
            this.options.pendingTime = 2000;
            this.options.pendingExit = true;
            this.options.pending = setInterval(this.onPendingExit, 100);
        },
        onPendingExit: function () {
            console.log("WEBPassport.Views.Dashboard:onPendingExit");
            this.options.pendingTime -= 100;
            if (this.options.pendingTime <= 0) {
                this.options.pendingExit = false;
                clearInterval(this.options.pending);
            }
        },
        showBtnsFuncEdit: function () {
            console.log("WEBPassport.Views.Dashboard:showBtnsFuncEdit");
            this.ui.btns_func_edit.show();
        },

        // для уничтожения полностью дашборда
        destroyAll: function () {
            console.log("WEBPassport.Views.Dashboard:destroyAll");

            // передаем вьюшке все атрибуты для обратного вызова виджета
            Backbone.trigger("WEBPassport.Views.Dashboard:clearAll");

            this.dialog.destroy();
            if (this.addWidgetDialog)
                this.addWidgetDialog.destroy();

            caruselDashboard.off("postchange");
            $this.carouselDashboardCollectionView.destroy();

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },

        // клик по меню (справа) открыть
        openMenu: function () {
            console.log("WEBPassport.Views.Dashboard:openMenu");
            Backbone.trigger("WEBPassport.Views.MainView:openMenu");
        },
        // клик по кнопке для открытия пользовательского бара
        openUserMenu: function () {
            console.log("WEBPassport.Views.Dashboard:openUserMenu");
            Backbone.trigger("WEBPassport.Views.MainView:openUserMenu");
        },
        // показать меню виджета
        dialogShow: function (attributes) {
            console.log("WEBPassport.Views.Dashboard:dialogShow");

            // передаем вьюшке все атрибуты для обратного вызова виджета
            Backbone.trigger("WEBPassport.Views.DialogMenuWidget:dialogShow", attributes);
            this.dialog.show();
        },
        // скрыть меню виджета
        dialogHide: function (attributes) {
            console.log("WEBPassport.Views.Dashboard:dialogHide");
            this.dialog.hide();
        },
        // показать меню на добавления виджетов
        dialogAddWidgetShow: function (attributes) {
            console.log("WEBPassport.Views.Dashboard:dialogAddWidgetShow");
            var $this = this;

            if (isEditDashboard) {
                return;
            }
            if (!$this.addWidgetDialog) {
                // создание меню для для добавления виджетов
                ons.createDialog('template-dialog-menu-add_widget').then(function (dialog) {
                    dialog.getDeviceBackButtonHandler().disable();

                    $this.addWidgetDialog = dialog;
                    WEBPassport.Views.dialogAddWidget = new WEBPassport.Views.DialogAddWidget({
                        el: $this.addWidgetDialog._element[0],
                    });
                    $this.addWidgetDialog.show();
                    WEBPassport.Views.dialogAddWidget.$el.i18n();
                });
            }
            else {
                var arr = WEBPassport.Views.dialogAddWidget.getWidgetsIsAdd()
                WEBPassport.Views.dialogAddWidget.widgetAddCollectionView.collection = new Backbone.Collection(arr);
                WEBPassport.Views.dialogAddWidget.widgetAddCollectionView.render();

                if (arr.length > 0)
                    this.addWidgetDialog.show();
            }
        },
        // скрыть меню на добавления виджетов
        dialogAddWidgetHide: function (attributes) {
            console.log("WEBPassport.Views.Dashboard:dialogAddWidgetHide");
            this.addWidgetDialog.hide();
        },
        // сохранить изменения виджетов
        saveDashboard: function (e) {
            console.log("WEBPassport.Views.Dashboard:saveDashboard");

            // сохраняем настройки виджетов и расположение
            var array = new Array();
            this.carouselDashboardCollectionView.children.forEach(function (v) {
                var model = new Object();
                var widgets = v.gridster.serialize();

                var newWidgets = Array();
                widgets.forEach(function (w) {
                    var tmpModel = {
                        id: w.id,
                        col: w.col,
                        row: w.row,
                        type: typeWidget[w.type]
                    }
                    tmpModel.type.size_x = w.size_x;
                    tmpModel.type.size_y = w.size_y;
                    newWidgets.push(tmpModel);
                })

                model.widgets = newWidgets;
                array.push(model);
            });

            window.settings.dashboard = array;
            window.settings.dashboardId = settingsDashboard;
            //TODO
            localStorage[settingsDashboard] = JSON.stringify(window.settings.dashboard)
            WEBPassport.requestModel.settingsSave(JSON.stringify(window.settings));
            //выключаем редактирование гридстера
            Backbone.trigger('WEBPassport.Views.Dashboard:gridsterDisableEdit');
            this.ui.btns_func_edit.hide();

            if (window.settings.isEffects)
                $(".widget").addClass("effects");

        },
        clickSaveFunc: function () {
            console.log("WEBPassport.Views.Dashboard:clickSaveFunc");
            Backbone.trigger("WEBPassport.Views.DashboardMenu:dashboardSave", true);
        },
        // отменить изменения виджетов
        cancelDashboard: function (e) {
            console.log("WEBPassport.Views.Dashboard:cancelDashboard");
            this.ui.btns_func_edit.hide();
            // отменяем изменения дашборда, просто рендерим дашборд
            this.render();
        },
        clickCancelFunc: function () {
            console.log("WEBPassport.Views.Dashboard:clickCancelFunc");
            Backbone.trigger("WEBPassport.Views.DashboardMenu:dashboardCancel", true);
        },
        // выключить редактирование виджетов
        gridsterDisableEdit: function () {
            console.log("WEBPassport.Views.Dashboard:gridsterDisableEdit");

            // выключаем редактирование гридстера
            Backbone.trigger('WEBPassport.Views.CarouselDashboardItemView:gridsterDisableEdit');
        },
        // включить листание карусели
        caruselEnable: function () {
            console.log("WEBPassport.Views.Dashboard:caruselEnable");
            // включаем листание карусели
            caruselDashboard.setSwipeable(true);
        },
        // выключить листание карусели
        caruselDisable: function () {
            console.log("WEBPassport.Views.Dashboard:caruselDisable");
            //выключаем листание карусели это для гридстера, когда перемещаем виджеты что бы не листалась карусель
            caruselDashboard.setSwipeable(false);
        },
        // добавить новую страницу для карусели
        addSlideToCarusel: function () {
            console.log("WEBPassport.Views.Dashboard:addSlideToCarusel");

            // добавляем страницу карусели и точку-индикатор
            // TODO: есть баг, когда добавляем страницу и потом свайпом листаем, то точка - индикатор не всегда срабатывает
            // точнее не срабатывает caruselDashboard.on("postchange"...
            var $this = this;
            $this.carouselDashboardCollectionView.collection.add(new Backbone.Model());
            $($this.ui.dotstyle).find("ul").prepend('<li class=""><a></a></li>');

            setTimeout(function () {
                //перелистываем карусель в конец
                // отмечаем точку-индикатор
                caruselDashboard.last();
                $($($this.ui.dotstyle).find("li")).removeClass("current");
                $($($this.ui.dotstyle).find("li")[caruselDashboard.getActiveCarouselItemIndex()]).addClass("current");
                // включаем редактирование гридстера
                Backbone.trigger('WEBPassport.Views.CarouselDashboardItemView:gridsterEnableEdit');
            }, 600);
        },
        // создание вьюшки/обработчки виджета
        createWidget: function (model) {
            console.log("WEBPassport.Views.Dashboard:createWidget");
            // Создаем виджет от его типа
            switch (baseTypeWidget[model.type.name].name) {
                case baseTypeWidget.Invoices.name:
                    new WEBPassport.Views.InvoicesWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.AZS.name:
                    new WEBPassport.Views.AZSWidget({el: "#" + model.id, model: new Backbone.Model(model)}).render();
                    break;
                case baseTypeWidget.BalanceCard.name:
                    new WEBPassport.Views.BalanceCardWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Coupons.name:
                    new WEBPassport.Views.CouponsWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Credit.name:
                    new WEBPassport.Views.CreditWidget({el: "#" + model.id, model: new Backbone.Model(model)}).render();
                    break;
                case baseTypeWidget.E_Policies.name:
                    new WEBPassport.Views.E_PoliciesWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Loyalty.name:
                    new WEBPassport.Views.LoyaltyWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.LoyaltyFoxtrot.name:
                    new WEBPassport.Views.LoyaltyFoxtrotWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.MyCards.name:
                    new WEBPassport.Views.MyCardsWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.MyQR.name:
                    new WEBPassport.Views.MyQRWidget({el: "#" + model.id, model: new Backbone.Model(model)}).render();
                    break;
                case baseTypeWidget.P2PcardToCard.name:
                    new WEBPassport.Views.P2PcardToCardWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Pager.name:
                    new WEBPassport.Views.PagerWidget({el: "#" + model.id, model: new Backbone.Model(model)}).render();
                    break;
                case baseTypeWidget.Presents.name:
                    new WEBPassport.Views.PresentsWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.PromotionsAndOffers.name:
                    new WEBPassport.Views.PromotionsAndOffersWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.QRScanner.name:
                    new WEBPassport.Views.QRScannerWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.RefillMobilePhone.name:
                    new WEBPassport.Views.RefillMobilePhoneWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Services.name:
                    new WEBPassport.Views.ServicesWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Settings.name:
                    new WEBPassport.Views.SettingsWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Wallet.name:
                    new WEBPassport.Views.WalletWidget({el: "#" + model.id, model: new Backbone.Model(model)}).render();
                    break;
                case baseTypeWidget.WebPassport.name:
                    new WEBPassport.Views.WebPassportWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Assistant.name:
                    new WEBPassport.Views.AssistantWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Telegram.name:
                    new WEBPassport.Views.TelegramWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.CreateInvoice.name:
                    new WEBPassport.Views.CreateInvoiceWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.CreditFox.name:
                    new WEBPassport.Views.CreditFoxWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.PaymentsLifecell.name:
                    new WEBPassport.Views.PaymentsLifecellWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Maxicard.name:
                    new WEBPassport.Views.MaxicardWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Help.name:
                    new WEBPassport.Views.HelpWidget({el: "#" + model.id, model: new Backbone.Model(model)}).render();
                    break;
                case baseTypeWidget.Support.name:
                    new WEBPassport.Views.SupportWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.PromotionsAndOffersDreamclub.name:
                    new WEBPassport.Views.PromotionsAndOffersDreamclubWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Partners.name:
                    new WEBPassport.Views.PartnersWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.BalancePromo.name:
                    new WEBPassport.Views.BalancePromoWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.BalanceBonuses.name:
                    new WEBPassport.Views.BalanceBonusesWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.MyQRDreamClub.name:
                    new WEBPassport.Views.MyQRDreamClubWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.QRScannerDreamClub.name:
                    new WEBPassport.Views.QRScannerDreamClubWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.WebPassportDreamClub.name:

                    var tmp = $.extend(true, {}, WEBPassport.mainViewModel.attributes);
                    var s = $.extend(tmp, model)

                    new WEBPassport.Views.WebPassportDreamClubWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(s)
                    }).render();
                    break;
                case baseTypeWidget.DreamClub.name:
                    new WEBPassport.Views.DreamClubWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Deposit.name:
                    new WEBPassport.Views.DepositWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.InvoicesQRPOS.name:
                    new WEBPassport.Views.InvoicesQRPOSWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.CreateInvoiceQRPOS.name:
                    new WEBPassport.Views.CreateInvoiceQRPOSWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.MyQRQRPOS.name:
                    new WEBPassport.Views.MyQRQRPOSWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.AcceptPaymentQRPOS.name:
                    new WEBPassport.Views.AcceptPaymentQRPOSWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.QRScannerQRPOS.name:
                    new WEBPassport.Views.QRScannerQRPOSWidget({
                        el: "#" + model.id,
                        model: new Backbone.Model(model)
                    }).render();
                    break;
                case baseTypeWidget.Users.name:
                    new WEBPassport.Views.UsersWidget({el: "#" + model.id, model: new Backbone.Model(model)}).render();
                    break;
                case baseTypeWidget.ActivateBalancePromo.name:
                    new WEBPassport.Views.ActivateBalancePromoWidget({ el: "#" + model.id, model: new Backbone.Model(model) }).render();
                    break;
                case baseTypeWidget.TransferBonuses.name:
                    new WEBPassport.Views.TransferBonusesWidget({ el: "#" + model.id, model: new Backbone.Model(model) }).render();
                    break;

				// CHANGES#RESMI
				case baseTypeWidget.Gifts.name:
					// alert(model.id)
                    new WEBPassport.Views.GiftsWidget({el: "#" + model.id, model: new Backbone.Model(model)}).render();
				break;
				case baseTypeWidget.MyWallets.name:
                    new WEBPassport.Views.MyWalletsWidget({el: "#" + model.id, model: new Backbone.Model(model)}).render();
				break;

            }
        },
        //сбросить настройки дашборда
        removeSettings: function (e) {
            console.log("WEBPassport.Views.Dashboard:removeSettings");
            localStorage[settingsDashboard] = "";
            window.settings.dashboard = "";
            window.settings.dashboardId = "";
            //TODO
            WEBPassport.requestModel.settingsSave(JSON.stringify(window.settings));
            //this.render();

            window.location.reload();
        },
        clickheaderTelegram: function (e) {
            console.log("WEBPassport.Views.Dashboard:clickheaderTelegram");
            Backbone.trigger('WEBPassport.Views.ModuleTelegramController:openFrame');
        }
    });

    // вьшка для карусели
    WEBPassport.Views.CarouselDashboardItemView = Marionette.ItemView.extend({
        tagName: "ons-carousel-item",
        className: "carousel_optimization",
        template: '#template_carousel_dashboard_item',
        ui: {
            gridster: "#gridster", // блок размещения виджетов
        },
        initialize: function () {
            console.log("WEBPassport.Views.CarouselDashboardItemView:initialize");

            // включить редактирование виджетов
            this.listenTo(Backbone, 'WEBPassport.Views.CarouselDashboardItemView:gridsterEnableEdit', this.gridsterEnableEdit);
            // выключить редактирование виджетов
            this.listenTo(Backbone, 'WEBPassport.Views.CarouselDashboardItemView:gridsterDisableEdit', this.gridsterDisableEdit);

            // для уничтожения полностью дашборда
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:clearAll', this.clearAll);

            this.bindUIElements();
        },
        onRender: function () {
            console.log("WEBPassport.Views.CarouselDashboardItemView:onRender");
            var $this = this;
            $($this.el).hide();

            var settingsWidget = getParamsWidget();
            setTimeout(function () {
                $this.gridster = $this.ui.gridster.gridster({
                    widget_base_dimensions: [settingsWidget.widthWinget / 2, settingsWidget.widthWinget * settingsWidget.heightWinget / 2],
                    widget_margins: [settingsWidget.widget_margins1, settingsWidget.widget_margins2],
                    max_cols: 6,
                    max_rows: 5,
                    helper: 'clone',
                    shift_larger_widgets_down: false,
                    // события когда мы начинаем перемещать виджета
                    draggable: {
                        stop: function (event, ui) {
                            var newrow = ui.$player[0].dataset.row;
                            var newcol = ui.$player[0].dataset.col;
                            console.log("newrow: " + newrow);
                            console.log("newcol: " + newcol);

                            // включить листание карусели
                            Backbone.trigger('WEBPassport.Views.Dashboard:caruselEnable');
                        },
                        start: function (event, ui) {
                            // выключить листание карусели
                            Backbone.trigger('WEBPassport.Views.Dashboard:caruselDisable');
                        },
                    },
                    // события когда мы начинаем изменять размер виджета
                    resize: {
                        enabled: true,
                        stop: function (event, ui, $widget) {
                            var size_x = $widget[0].dataset.sizex;
                            var size_y = $widget[0].dataset.sizey;
                            console.log("size_x: " + size_x);
                            console.log("size_y: " + size_y);

                            // включить листание карусели
                            Backbone.trigger('WEBPassport.Views.Dashboard:caruselEnable');
                            // рендерим виджет в зависимости от его размера
                            Backbone.trigger('WEBPassport.Views.IWidget:resizeWidget' + $widget[0].dataset.id, $widget[0].dataset);
                        },
                        resize: function (e, ui, $widget) {

                        },
                        start: function (event, ui, $widget) {
                            // выключить листание карусели
                            Backbone.trigger('WEBPassport.Views.Dashboard:caruselDisable');
                            // эффекты при изменении виджета
                            Backbone.trigger('WEBPassport.Views.IWidget:startResizeWidget' + $widget[0].dataset.id);
                        },
                    }

                }).data('gridster');

                //// удаляем все виджеты которые есть ( но их нету =) для прикола )
                //$this.gridster.remove_all_widgets();

                // добавляем виджеты из модели
                if ($this.model.attributes.widgets) {
                    $.each($this.model.attributes.widgets, function () {
                        if (typeWidget[this.type.name]) { // если виджет доступен
                            var dsf = $this.gridster.add_widget(
                                '<li />',
                                this.id,
                                this.type.size_x,
                                this.type.size_y,
                                this.col,
                                this.row,
                                this.type.max_size,
                                this.type.min_size,
                                this.type.name);

                            // создание вьюшки по типу для виджета
                            Backbone.trigger('WEBPassport.Views.Dashboard:createWidget', this);
                        }
                    });
                    $($this.el).show();
                }
                // отключаем изменения размера и перетаскивание
                $this.gridster.drag_api.disable();
                $this.gridster.resize_api.disable();

            },0);
            //ons.compile($this.$el.get(0));
        },
        // включить редактирование виджетов
        gridsterEnableEdit: function (e) {
            console.log("WEBPassport.Views.CarouselDashboardItemView:gridsterEnableEdit");

            // включаем режим редактирования виджетов и
            // показываем уголки для изм. размера
            this.gridster.drag_api.enable();
            this.gridster.resize_api.enable();
            $(".gs-resize-handle").show();
        },
        // выключить редактирование виджетов
        gridsterDisableEdit: function (e) {
            console.log("WEBPassport.Views.CarouselDashboardItemView:gridsterDisableEdit");

            // выключаем режим редактирования виджетов и
            // сркываем уголки для изм. размера
            this.gridster.drag_api.disable();
            this.gridster.resize_api.disable();
            $(".gs-resize-handle").hide();
        },
        clearAll: function () {
            console.log("WEBPassport.Views.CarouselDashboardItemView:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    // коллекция для карусели
    WEBPassport.Views.CarouselDashboardCollectionView = Marionette.CollectionView.extend({
        childView: WEBPassport.Views.CarouselDashboardItemView,
        onRender: function () {
            console.log("WEBPassport.Views.CarouselDashboardCollectionView:onRender");
            // ons.compile(this.$el.get(0));

        },
        onAddChild: function () {
            console.log("WEBPassport.Views.CarouselDashboardCollectionView:onAddChild");
        },
    });

    // окно для добавления виджетов
    WEBPassport.Views.DialogAddWidget = Marionette.ItemView.extend({
        ui: {
            list_widget: '#list_widget',
        },
        initialize: function () {
            console.log("WEBPassport.Views.DialogAddWidget:initialize");

            this.bindUIElements();

            // строем список доступных виджетов
            this.widgetAddCollectionView = new WEBPassport.Views.WidgetAddCollectionView({
                collection: new Backbone.Collection(this.getWidgetsIsAdd()),
                el: this.ui.list_widget
            }).render();
        },

        //вернуть список выджетов который еще не добавлен на дашборд
        getWidgetsIsAdd: function () {
            console.log("WEBPassport.Views.DialogAddWidget:getWidgetsIsAdd");
            Backbone.trigger('WEBPassport.Views.WidgetAddItem:lock', false);

            // мини конвертация списка виджетов в масив
            var array = new Array();

            var widgetsInDash = new Array();
            var tmp
            // загружаем виджеты из настроек, если первый запуска то загружаем по станадртной схеме
            if (localStorage[settingsDashboard])
                tmp = JSON.parse(localStorage[settingsDashboard]);
            else
                tmp = getStandartShema();

            tmp.forEach(function (a) {
                a.widgets.forEach(function (w, i) {
                    if (typeWidget[w.type.name]) {// если виджет доступен
                        widgetsInDash.push(w);
                    }
                });
            });

            $.each(typeWidget, function (a) {
                if (isAvailableWidget(a)) {// если виджет доступен
                    array.push(this);
                }

            });

            var newList = new Array();
            array.forEach(function (a) {
                var isA = false;
                widgetsInDash.forEach(function (b) {
                    if (a.name == b.type.name) {
                        isA = true;
                        return false;
                    }
                });

                if (!isA)
                    newList.push(a);
            });

            return newList;
        },
    });

    // строка для списка виджетов
    WEBPassport.Views.WidgetAddItem = Marionette.ItemView.extend({
        template: "#template-dialog-menu-add_widget_item",
        tagName: "ons-list-item",
        attributes: {
            "modifier": "tappable",
        },
        initialize: function () {
            console.log("WEBPassport.Views.WidgetAddItem:initialize " + this.model.attributes.name);

            // для уничтожения полностью дашборда
            this.listenTo(Backbone, 'WEBPassport.Views.Dashboard:clearAll', this.clearAll);
            // для блокировки клика при выборе виджета ( можно быстро кликать на виджет и добавиться больше чем 1 )
            this.listenTo(Backbone, 'WEBPassport.Views.WidgetAddItem:lock', this.setLock);
        },
        isLock: false,
        events: {
            "click": "addWidget", // клик на строку в списке виджетов
        },
        // клик на строку в списке виджетов
        addWidget: function () {
            console.log("WEBPassport.Views.WidgetAddItem:addWidget");
            if (this.isLock) return;

            Backbone.trigger('WEBPassport.Views.Dashboard:dialogAddWidgetHide');
            Backbone.trigger('WEBPassport.Views.WidgetAddItem:lock', true);

            var activeIndex = caruselDashboard.getActiveCarouselItemIndex();
            var viewActive = WEBPassport.Views.dashboard.carouselDashboardCollectionView.children.findByIndex(activeIndex);

            var newWidget = {
                id: $.newguid(),
                col: 10,
                row: 10,
                type: this.model.attributes
            };

            viewActive.gridster.add_widget(
                            '<li />',
                            newWidget.id,
                            newWidget.type.size_x,
                            newWidget.type.size_y,
                            newWidget.col,
                            newWidget.row,
                            newWidget.type.max_size,
                            newWidget.type.min_size,
                            newWidget.type.name);

            // создание вьюшки по типу для виджета
            Backbone.trigger('WEBPassport.Views.Dashboard:createWidget', newWidget);
            //Backbone.trigger('WEBPassport.Views.DashboardMenu:dashboardEdit');
            Backbone.trigger("WEBPassport.Views.DashboardMenu:dashboardSave", true);
        },
        clearAll: function () {
            console.log("WEBPassport.Views.WidgetAddItem:clearAll");

            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },

        // для блокировки клика при выборе виджета ( можно быстро кликать на виджет и добавиться больше чем 1 )
        setLock: function (i) {
            console.log("WEBPassport.Views.WidgetAddItem:setLock");
            this.isLock = i
        }
    });

    // коллекция для списка виджетов
    WEBPassport.Views.WidgetAddCollectionView = Marionette.CollectionView.extend({
        childView: WEBPassport.Views.WidgetAddItem,
        onRender: function () {
            console.log("WEBPassport.Views.WidgetAddCollectionView:onRender");
            ons.compile(this.$el.get(0));
        },
        onAddChild: function () {
            console.log("WEBPassport.Views.WidgetAddCollectionView:onAddChild");
        },
    });
});

ons.ready(function () {
    if (typeWidget.RefillMobilePhone)
        switch(wlPath){
            case "TripWallet":{
                baseTypeWidget.RefillMobilePhone.urlIcon = typeWidget.RefillMobilePhone.urlIcon = "fa icon-mobile";
                break;
            }
            default :{
                baseTypeWidget.RefillMobilePhone.urlIcon = typeWidget.RefillMobilePhone.urlIcon = "fa icon-refill-mobile-phone-v3";
                break;
            }
        }
});

// стандартная схема виджетов
var getStandartShema = function () {
    console.log("getStandartShema");
    if (isBusiness) {
        baseTypeWidget.Settings.size_x = 3;
        baseTypeWidget.Settings.max_size = [6, 4];
        baseTypeWidget.CreateInvoiceQRPOS.size_x = 3;
        baseTypeWidget.CreateInvoiceQRPOS.max_size = [6, 4];
        baseTypeWidget.InvoicesQRPOS.size_x = 3;
        baseTypeWidget.InvoicesQRPOS.max_size = [6, 4];
        baseTypeWidget.MyQRQRPOS.size_x = 3;
        baseTypeWidget.MyQRQRPOS.size_y = 2;
        baseTypeWidget.MyQRQRPOS.max_size = [6, 4];
        baseTypeWidget.AcceptPaymentQRPOS.size_x = 3;
        baseTypeWidget.AcceptPaymentQRPOS.max_size = [6, 4];
        baseTypeWidget.QRScannerQRPOS.size_x = 3;
        baseTypeWidget.QRScannerQRPOS.size_y = 2;
        baseTypeWidget.QRScannerQRPOS.max_size = [6, 4];
        return [{
            widgets: [
              { id: $.newguid(), col: 1, row: 1, type: baseTypeWidget.Settings },
              { id: $.newguid(), col: 4, row: 1, type: baseTypeWidget.CreateInvoiceQRPOS },
              { id: $.newguid(), col: 1, row: 3, type: baseTypeWidget.InvoicesQRPOS },

              { id: $.newguid(), col: 4, row: 3, type: baseTypeWidget.AcceptPaymentQRPOS },
              { id: $.newguid(), col: 1, row: 5, type: baseTypeWidget.MyQRQRPOS },
              { id: $.newguid(), col: 4, row: 5, type: baseTypeWidget.QRScannerQRPOS },
            ]
        }];
    }
    else {
        baseTypeWidget.Invoices.size_x = 2;
        baseTypeWidget.Loyalty.size_x = 3;
        baseTypeWidget.Wallet.size_x = 3;
        baseTypeWidget.RefillMobilePhone.size_x = 2;
        baseTypeWidget.Telegram.size_x = 3;
        return [{
            widgets: [
              { id: $.newguid(), col: 1, row: 1, type: baseTypeWidget.WebPassport },
              { id: $.newguid(), col: 3, row: 1, type: baseTypeWidget.MyCards },
              { id: $.newguid(), col: 5, row: 1, type: baseTypeWidget.P2PcardToCard },

              { id: $.newguid(), col: 1, row: 3, type: baseTypeWidget.Loyalty },
              { id: $.newguid(), col: 4, row: 3, type: baseTypeWidget.Wallet },

              { id: $.newguid(), col: 1, row: 5, type: baseTypeWidget.RefillMobilePhone },
              { id: $.newguid(), col: 3, row: 5, type: baseTypeWidget.Credit },
              { id: $.newguid(), col: 5, row: 5, type: baseTypeWidget.Services },

              { id: $.newguid(), col: 1, row: 7, type: baseTypeWidget.MyQR },
              { id: $.newguid(), col: 4, row: 7, type: baseTypeWidget.QRScanner },
            ]
        },
                 {
                     widgets: [
                        { id: $.newguid(), col: 1, row: 1, type: baseTypeWidget.Maxicard },
                        { id: $.newguid(), col: 3, row: 1, type: baseTypeWidget.Coupons },
                        { id: $.newguid(), col: 5, row: 1, type: baseTypeWidget.Presents },
                        { id: $.newguid(), col: 1, row: 5, type: baseTypeWidget.CreateInvoice },
                        { id: $.newguid(), col: 3, row: 5, type: baseTypeWidget.Settings },
                        { id: $.newguid(), col: 5, row: 5, type: baseTypeWidget.Pager },
                       { id: $.newguid(), col: 1, row: 7, type: baseTypeWidget.PromotionsAndOffers },
                       { id: $.newguid(), col: 3, row: 7, type: baseTypeWidget.E_Policies },
                       { id: $.newguid(), col: 5, row: 7, type: baseTypeWidget.AZS },
                       { id: $.newguid(), col: 1, row: 9, type: baseTypeWidget.Telegram },
                       { id: $.newguid(), col: 4, row: 9, type: baseTypeWidget.Invoices },

                     ]
                 }];
    }
};

var settingsDefault = {
    lang: [
       {
           active: false,
           value: "ru",
           locale: "ru-ru",
           tittle: "Русский",
       },
       {
           active: false,
           value: "uk",
           locale: "en-us",
           tittle: "Українська",
       },
       {
           active: true,
           value: "en",
           locale: "en-us",
           tittle: "English",
       },
       //{
       //    active: false,
       //    value: "de",
       //    locale: "de-de",
       //    tittle: "Deutsch",
       //},
       {
           active: false,
           value: "fr",
           locale: "en-us",
           tittle: "Français",
       },
        {
            active: false,
            value: "kz",
            locale: "en-us",
            tittle: "Қазақ",
        },
        {
            active: false,
            value: "pt",
            locale: "pt-br",
            tittle: "Português",
        },
    ],
    isEffects: true,
};
ons.ready(function () {
    baseTypeWidget.Partners.urlIcon = typeWidget.Partners.urlIcon = "fa icon-partners";
    baseTypeWidget.PromotionsAndOffersDreamclub.urlIcon = typeWidget.PromotionsAndOffersDreamclub.urlIcon = "fa icon-shares-d1";
    baseTypeWidget.Telegram.urlIcon = typeWidget.Telegram.urlIcon = "fa icon-chat-d1";
    baseTypeWidget.MyQRDreamClub.urlIcon = typeWidget.MyQRDreamClub.urlIcon = "fa icon-myqr-d2";
    baseTypeWidget.QRScannerDreamClub.urlIcon = typeWidget.QRScannerDreamClub.urlIcon = "fa icon-scanqr-d2";
    baseTypeWidget.WebPassportDreamClub.urlIcon = typeWidget.WebPassportDreamClub.urlIcon = "fa icon-profile-d1";

	baseTypeWidget.Gifts.urlIcon = typeWidget.WebPassportDreamClub.urlIcon = "fa icon-presents-v2";
	baseTypeWidget.MyWallets.urlIcon = typeWidget.WebPassportDreamClub.urlIcon = "fa icon-mycards";

});

// стандартная схема виджетов
var getStandartShema = function () {

    baseTypeWidget.Invoices.size_x = 2;
    baseTypeWidget.BalancePromo.size_x = 3;
    baseTypeWidget.BalanceBonuses.size_x = 3;
    baseTypeWidget.MyQRDreamClub.size_y = 2;
    baseTypeWidget.QRScannerDreamClub.size_y = 2;
    baseTypeWidget.PromotionsAndOffersDreamclub.size_x = 3;
    baseTypeWidget.Partners.size_x = 3;
    baseTypeWidget.ActivateBalancePromo.size_x = 3;
    baseTypeWidget.WebPassportDreamClub.size_x =6;
    baseTypeWidget.WebPassportDreamClub.size_y = 4;
    baseTypeWidget.TransferBonuses.size_x = 3;
	baseTypeWidget.Gifts.size_x = 3;
	baseTypeWidget.MyWallets.size_x = 3;

    return [{
        widgets: [
           { id: $.newguid(), col: 1, row: 1, type: baseTypeWidget.WebPassportDreamClub },
		   { id: $.newguid(), col: 1, row: 5, type: baseTypeWidget.MyWallets },
		   { id: $.newguid(), col: 4, row: 5, type: baseTypeWidget.TransferBonuses },

		  //{ id: $.newguid(), col: 1, row: 5, type: baseTypeWidget.BalancePromo },
		  //{ id: $.newguid(), col: 4, row: 5, type: baseTypeWidget.BalanceBonuses },

           { id: $.newguid(), col: 1, row: 7, type: baseTypeWidget.Partners },
           { id: $.newguid(), col: 4, row: 7, type: baseTypeWidget.ActivateBalancePromo },

           { id: $.newguid(), col: 1, row: 9, type: baseTypeWidget.PromotionsAndOffersDreamclub },
           { id: $.newguid(), col: 4, row: 9, type: baseTypeWidget.Gifts },

           { id: $.newguid(), col: 1, row: 11, type: baseTypeWidget.MyQRDreamClub },
           { id: $.newguid(), col: 4, row: 11, type: baseTypeWidget.QRScannerDreamClub },
        ]
    },
    ];

};

var settingsDefault = {
    lang: [
       {
           active: true,
           value: "ru",
           locale: "ru-ru",
           tittle: "Русский",
       }
    ],
    isEffects: true,
};
//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

(function() {
  var _global = this;

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng;

  // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
  //
  // Moderately fast, high quality
  if (typeof(_global.require) == 'function') {
    try {
      var _rb = _global.require('crypto').randomBytes;
      _rng = _rb && function() {return _rb(16);};
    } catch(e) {}
  }

  if (!_rng && _global.crypto && crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    var _rnds8 = new Uint8Array(16);
    _rng = function whatwgRNG() {
      crypto.getRandomValues(_rnds8);
      return _rnds8;
    };
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
  }

  // Buffer class to use
  var BufferClass = typeof(_global.Buffer) == 'function' ? _global.Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = options.msecs != null ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) == 'string') {
      buf = options == 'binary' ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;

  if (typeof define === 'function' && define.amd) {
    // Publish as AMD module
    define(function() {return uuid;});
  } else if (typeof(module) != 'undefined' && module.exports) {
    // Publish as node.js module
    module.exports = uuid;
  } else {
    // Publish as global (in browsers)
    var _previousRoot = _global.uuid;

    // **`noConflict()` - (browser only) to reset global 'uuid' var**
    uuid.noConflict = function() {
      _global.uuid = _previousRoot;
      return uuid;
    };

    _global.uuid = uuid;
  }
}).call(this);

var cl;

    function createSign(appid, seed, ts) {
    var sign, str;

    str=appid;
    str+=":";
    str+=seed;
    str+=":";
    str+=ts;
    str+=":";
    str += localStorage.signkey;

    sign=SHA1(str);

    return sign;
}

function add_zero(num) {
    return num < 10 ? '0' + num : num;
}

function add_2zero(num) {
    if (num < 10) return '00' + num;
    if (num < 100) return '0' + num;
    return num;
}

/**  Secure Hash Algorithm (SHA1)
*  http://www.webtoolkit.info/
*
**/
function SHA1 (msg) {
    function rotate_left(n,s) {
        var t4 = ( n<<s ) | (n>>>(32-s));
        return t4;
    };
    function lsb_hex(val) {
        var str="";
        var i;
        var vh;
        var vl;
        for( i=0; i<=6; i+=2 ) {
            vh = (val>>>(i*4+4))&0x0f;
            vl = (val>>>(i*4))&0x0f;
            str += vh.toString(16) + vl.toString(16);
        }
        return str;
    };
    function cvt_hex(val) {
        var str="";
        var i;
        var v;
        for( i=7; i>=0; i-- ) {
            v = (val>>>(i*4))&0x0f;
            str += v.toString(16);
        }
        return str;
    };
    function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    };
    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;
    msg = Utf8Encode(msg);
    var msg_len = msg.length;
    var word_array = new Array();
    for( i=0; i<msg_len-3; i+=4 ) {
        j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
        msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
        word_array.push( j );
    }
    switch( msg_len % 4 ) {
        case 0:
            i = 0x080000000;
            break;
        case 1:
            i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
            break;
        case 2:
            i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
            break;
        case 3:
            i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8    | 0x80;
            break;
    }
    word_array.push( i );
    while( (word_array.length % 16) != 14 ) word_array.push( 0 );
    word_array.push( msg_len>>>29 );
    word_array.push( (msg_len<<3)&0x0ffffffff );
    for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
        for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
        for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;
        for( i= 0; i<=19; i++ ) {
            temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }
        for( i=20; i<=39; i++ ) {
            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }
        for( i=40; i<=59; i++ ) {
            temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }
        for( i=60; i<=79; i++ ) {
            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }
        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;
    }
    var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
    return temp.toLowerCase();
}
// подсчитать общую сумму билетов заказа
function totalCost(selectorFind,selectorSum){

    var totCost= 0.0;
    var cost = 0;
    var costTickets = $(selectorFind).find("span");

    //var costTickets = $(selectorFind).find("span").text().split(" ");
    //console.log("costTickets ="+$(selectorFind).find("span").text()+"=");

    for (var i=0; i < costTickets.length; i++){
        //console.log(costTickets[i].innerHTML);
        cost = isNaN(parseInt(costTickets[i].innerHTML)) ? 0 : +costTickets[i].innerHTML;
        //console.log("cost="+cost);
        totCost += cost;
    }
    // проверить есть ли сумма по билетам, если нет, то спрячем сообщение
    // $this.find('.ticket_price span').text(ticket_cost.toFixed(2).replace('.', ','));
    if (totCost > 0 )
    {
        $(selectorSum).text(totCost.toFixed(2));
    }
    else{
        $("#order_parts").hide();
    }

}

function recount_timer($timer, callback){
    var timer_seconds = parseInt($timer.attr('data-seconds')) - 1;

    if(timer_seconds > 0){
        $timer.attr('data-seconds', timer_seconds);
        var s = timer_seconds;

        var hours = Math.floor(s / 3600); // hours
        s %= 3600;
        var minutes = Math.floor(s / 60); // minutes
        s %= 60;
        var seconds = s; // seconds

        $timer.children('span').text((hours > 0 ? add_zero(hours)+':' : '')+add_zero(minutes)+':'+add_zero(seconds));
    }else{
        clearInterval(parseInt($timer.attr('data-id')));
        if(typeof(callback) == 'function'){
            callback();
        }
    }
}

function clear_all_timers(){
    $.each(timer_intervals, function(id, $el){
        clearInterval(id);
    });
}

function init_timers(){
    var $timers = $('.timer');
    clear_all_timers();
    $timers.each(function(){
        var $this = $(this),
            id = parseInt($this.attr('data-id'));
        if(id){
            clearInterval(id);
        }
        recount_timer($this);
        var new_interval = setInterval(function(){
            recount_timer($this, function(){
                remove_ticket_from_cart($this.closest('.cart_ticket_parent').find('.remove_ticket'), false);
            });
        }, 1000);
        $this.attr('data-id', new_interval);
        timer_intervals[new_interval] = $this;
    });
}
/*
* обновление списка недавних выбранных станций
* key - ключ для localStorage, определяющий какой список недавних станций обновлять (прибытия или отправления).
* item - объект, который будет вставляться в список
* length - длина списка истории.
* */
function update_recent_list(key,item,maxLenght){
    var recent=localStorage[key];
    var recentArr=[];
    /*если список пустой, добавляем в него значение*/
    if(!recent){
        console.log("recent empty");
        recentArr.unshift(item);
    }
    else{
        recentArr=JSON.parse(localStorage[key]);
        /*если список не пустой, сравниваем добавляемый объект с последним добавленным в списке.
        * если коды станций совпадают, не добавляем*/

        switch (key){
            case 'recentStationsFrom':
                if(item.pointFrom.code!=recentArr[0].pointFrom.code) {
                    /*если длина списка недавних элементов равна или больше параметра length,
                     * удаляем из конца списка самый старый элемент*/
                    if(recentArr.length>=maxLenght)
                    {
                        recentArr.pop();
                    }

                    /*вставляем в начало списка новый элемент*/
                    recentArr.unshift(item);
                }
                break;
            case 'recentStationsTo':
                if(item.pointTo.code!=recentArr[0].pointTo.code) {
                    /*если длина списка недавних элементов равна или больше параметра length,
                     * удаляем из конца списка самый старый элемент*/
                    if(recentArr.length>=maxLenght)
                    {
                        recentArr.pop();
                    }

                    /*вставляем в начало списка новый элемент*/
                    recentArr.unshift(item);
                }
                break;
            case 'recentRoutes':
                if(item.pointFrom.code!=recentArr[0].pointFrom.code&&item.pointTo.code!=recentArr[0].pointTo.code) {
                    /*если длина списка недавних элементов равна или больше параметра length,
                     * удаляем из конца списка самый старый элемент*/
                    if(recentArr.length>=maxLenght)
                    {
                        recentArr.pop();
                    }

                    /*вставляем в начало списка новый элемент*/
                    recentArr.unshift(item);
                }
                break;
        }

    }
    localStorage[key]=JSON.stringify(recentArr);
}

/*
* запись в localStorage ответа payInfo
* */

function save_payInfo_response(item){
    var payInfoStr=localStorage['payInfo'];
    var payInfoArr=[];
    if(!payInfoStr) {
        payInfoArr.push(item);
    }
    else{
        payInfoArr=JSON.parse(localStorage['payInfo']);
        payInfoArr.push(item);
    }
    localStorage['payInfo']=JSON.stringify(payInfoArr);
}

//перевод миллисекунд в строку формата hh:mm:ss.ms
function millisecondsToLongString(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = add_zero(hours);
    minutes = add_zero(minutes);
    seconds = add_zero(seconds);

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

//перевод миллисекунд в строку формата hh:mm:ss. если интервал меньше часа, то формат mm:ss
function millisecondsToShortString(duration) {
    var  seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 1) ? "" : add_zero(hours)+":";
    minutes = add_zero(minutes);
    seconds = add_zero(seconds);

    return hours +  minutes + ":" + seconds;
}

function initLoader() {
    hideLoader();
    //var container = document.getElementById('canvasloader');
    //var boxLoader = document.getElementById('boxLoader');
    //var box = document.getElementById('box');

    //TweenMax.set([boxLoader], {
    //    position: 'absolute',
    //    top: '50%',
    //    left: '50%',
    //    xPercent: -50,
    //    yPercent: -50
    //})

    //TweenMax.set([container], {
    //    position: 'absolute',
    //    top: '50%',
    //    left: '50%',
    //    xPercent: -50,
    //    yPercent: -50
    //})

    //var tl = new TimelineMax({
    //    repeat: -1
    //});

    //tl.timeScale(1.3)

    //tl.set(boxLoader, {
    //    transformOrigin: '0% 100%'
    //})
    //.to(boxLoader, 1, {
    //    rotation: -90,
    //    ease: Power4.easeInOut

    //})
    //.to(boxLoader, 0.2, {
    //    scaleX: 0.3,
    //    ease: Power1.easeIn
    //}, '-=0.9')
    //.to(boxLoader, 1, {
    //    left: '+=20',
    //    ease: Linear.easeNone
    //}, '-=1')
    //.to(boxLoader, 0.2, {
    //    scaleX: 1,
    //    ease: Power1.easeIn
    //}, '-=0.2')
}

function hideLoader(){
    $('#tagwayLoader').hide();
    $('#tagwayLoader').css('z-index', '-1');
}

function showLoader(){
    $('#tagwayLoader').show();
    $('#tagwayLoader').css('z-index', '99999');
}

function setRenderPage(el,templateHtml,name)
{
    var pageScope = el._createPageScope();
    var object = el._createPageElementAndLinkFunction(templateHtml, pageScope);
    el._pushPageDOM(name, object.element, object.link, pageScope, options, null);
}


$(document).ready(function () {
    // указываем тегвея для мобипея или нет
    localStorage.ifForMobiPay = localStorage.configTagwayIfForMobiPay;
        // указываем продакшин
    localStorage.tagwayProd = localStorage.configTagwayIsProd;


    if (JSON.parse(localStorage.tagwayProd)) { /* ---- PROD ---- */
        if (JSON.parse(localStorage.ifForMobiPay)) {
            if (localStorage.tagwayAppIdForProd)
                localStorage.appid = localStorage.tagwayAppIdForProd;
            else
                localStorage.appid = 6;

            localStorage.signkey = localStorage.tagwaySignKeyForProd;
            localStorage.urlHost = "https://gate.tagway.com.ua:42116/v3/";
        }
        else {
            localStorage.appid = 7;
            localStorage.signkey = 's9AS68MJsM5hNcPt';
            localStorage.urlHost = "https://gate.tagway.com.ua:42116/v2/";
            localStorage.urlMerchant = "https://merchant.tagway.com.ua/";
            localStorage.urlrecoveryPass = "https://gate.tagway.com.ua:47116/";
        }
    }
    else {/* ---- TEST ---- */
        if (JSON.parse(localStorage.ifForMobiPay)) {
            if (localStorage.tagwayAppIdForTest)
                localStorage.appid = localStorage.tagwayAppIdForTest;
            else
                localStorage.appid = 11;

            localStorage.signkey = localStorage.tagwaySignKeyForTest;
            localStorage.urlHost = "http://sit.gate.tagway.com.ua:43116/v3/";
        }
        else {
            localStorage.appid = 3;
            localStorage.signkey = 'technoport!virtual';
            localStorage.urlHost = "http://sit.gate.tagway.com.ua:43116/v2/";
            localStorage.urlMerchant = "http://merchant.sit.tagway.com.ua/";
            localStorage.urlrecoveryPass = "http://a1.sit.moby.tagway.com.ua:47116/";
        }
    }

    WEBPassport.Models.LightRegistrationModel = Backbone.Model.extend({

        setCommonParameters: function () {

            var seed = uuid.v1(),
                ts = moment().format("YYYY-MM-DD HH:mm:ss"),
                sign = createSign(localStorage.appid, seed, ts),
                common, auth, client;

            client = {
                "cellular": "",
                "email": "",
                "clientSession": "",
            };
            common = {
                "language": "",
                "currency": "uah",
                "client": "",
            };
            auth = {
                "appid": localStorage.appid,
                "sign": sign.toString(),
                "ts": ts,
                "seed": seed.toString(),
                "partnerid": ""
            };
            this.set('auth', auth);
            this.set('common', common);
        },
        url: function () {
            var  url = localStorage.urlHost + '/json/syncreply/RegistrationLight';

            return url;
        }
    });

    WEBPassport.lightRegistrationModel = new WEBPassport.Models.LightRegistrationModel();
});
ons.ready(function () {

    //Вьюшка для медиатор модуля TagWay
    WEBPassport.Views.ModuleTagWayController = Marionette.ItemView.extend({
        el: 'body',
        initialize: function () {
            console.log("WEBPassport.Views.ModuleTagWayController:initialize");

            //получаем сессию для TagWay
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTagWayController:getSessionTagWay', this.getSessionTagWay);

            //открытие фрейма с тегвеем
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTagWayController:openTagWayFrame', this.openTagWayFrame);
            //закрытие фрейма с тегвеем
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTagWayController:closeTagWayFrame', this.closeTagWayFrame);
            //закрытие фрейма с тегвеем и очистка фрейма
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTagWayController:closeAndClearTagWayFrame', this.closeAndClearTagWayFrame);
            //передаем во фрейм event BackButton
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTagWayController:sendToIframeBackButton', this.sendToIframeBackButton);
            //вызываем форму оплаты
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTagWayController:paymentQR', this.paymentQR);

            //открытие фрейма с тегвеем после успешной оплаты билета
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTagWayController:openTagWayFramePaySuccess', this.openTagWayFramePaySuccess);
            //изменение языка
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTagWayController:changeLanguage', this.changeLanguage);

            ////загрузка ферйма(событие)
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTagWayController:onloadTagWay', this.onloadTagWay);

            //удачная оплата
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTagWayController:paymentSuccess', this.paymentSuccess);

            //отмена счета
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTagWayController:clearCart', this.clearTagwayCart);

            //построить/привязать UI елементы
            this.bindUIElements();

            _.bindAll(this, 'onSuccessPaymentQR');

            //ссыkки на модули
            this.moduleTagWayUrl = "../www/TagWay/index.html";
            //this.moduleXXXUrl = "/android_asset/www/XXX/index.html";
        },
        ui: {
            div_iframe_tagway: "#div-iframe-tagway", // блок div с iframe для tagway
            iframe_tagway: "#iframe-tagway",// iframe для tagway
        },
        changeLanguage: function () {
            console.log("WEBPassport.Views.ModuleTagWayController:changeLanguage");

            var $this = this;

            var callback = function () {
                $this.ui.iframe_tagway[0].contentWindow.Backbone.trigger('Tagway.View.App:changeLanguage');
            }
            $this.checkingDownloadedModule(callback, false);
        },
        onloadTagWay: function () {
            this.isLoadModule = true;

            this.ui.iframe_tagway[0].contentWindow.Backbone.trigger('Tagway.View.App:openFrameAndRefrash');
        },
        paymentQR: function (data) {
            console.log("WEBPassport.Views.ModuleTagWayController:paymentQR data:" + data ? JSON.stringify(data) : "");

            //this.flagForLoadTagWay = true;
            localStorage["paymentModulName"] = "TagWay";
            ShowLoader();

            this.closeTagWayFrame();

            // отправка запроса
            WEBPassport.requestModel.paymentQR(localStorage.session, data.invoices[0]);
            WEBPassport.requestModel.sandData(this.onSuccessPaymentQR);
        },

        onSuccessPaymentQR: function (model, response, options) {
            console.log("WEBPassport.Views.ModuleTagWayController:onSuccessPaymentQR");
            var resp = JSON.parse(response.json);

            mobipayNavigatorOpen(mobipayPage.cart,"left",
                               {
                                   backgroundColor: "rgb(146, 76, 112)",
                                   opis: resp.opis,
                                   currency_mask: resp.currency_mask,
                                   amount: resp.amount,
                                   site_domen: resp.site_domen,
                                   site_name: resp.site_name,
                                   keypay: resp.keypay,
                                   products: resp.products,
                                   payments: resp.payments,
                                   fields_app: resp.fields_app,
                                   fromScreen: mobipayPage.invoices,
                                   token: resp.token,

                               }
                           );
        },


        paymentSuccess: function () {
            console.log("WEBPassport.Views.ModuleTagWayController:paymentSuccess");

            var $this = this;

            var callback = function () {
                $this.ui.iframe_tagway[0].contentWindow.Backbone.trigger('Tagway.View.App:paymentSuccess');
            }
            $this.checkingDownloadedModule(callback, false);
        },

        clearTagwayCart: function (data) {
            console.log("WEBPassport.Views.ModuleTagWayController:clearTagwayCart data:" + data ? JSON.stringify(data) : "");
            var $this = this;

            var callback = function () {
                $this.ui.iframe_tagway[0].contentWindow.Backbone.trigger('cart:clearCart', data);
            }
            $this.checkingDownloadedModule(callback, false);
        },

        //onPaymentQRSuccess: function (model, response, options) {
        //    WEBPassport.mainView.model.set('state', cmd_names.CMD_PAYMENT_QR);

        //},
        //onPaymentQRError: function (model, response, options) {
        //},

        getSessionTagWay: function(email, isOpenFrame)
        {
            console.log("WEBPassport.Views.ModuleTagWayController:getSessionTagWay email:" + email);

            WEBPassport.lightRegistrationModel.setCommonParameters();
            WEBPassport.lightRegistrationModel.set('email', email);
            WEBPassport.lightRegistrationModel.set('cellular', "");
            localStorage["email"] = email;
            WEBPassport.lightRegistrationModel.save().always($.proxy(function (data) {

                if (!data.responseText && data.session && data.session != -1) {
                    console.log("lightRegistration session=" + data.session);
                    localStorage["tagwaySession"] = data.session;

                    if(isOpenFrame)
                        Backbone.trigger('WEBPassport.Views.ModuleTagWayController:openTagWayFrame');
                }
                //else {
                //    var msgErr = JSON.parse(data.responseText);
                //    console.log("msgErr = " + msgErr.ResponseStatus.Message);
                //}
            }), this);

            this.ui.iframe_tagway.attr("src", this.moduleTagWayUrl);

            //var $this = this;
            //setTimeout(function () {
            //    console.log($this.ui.iframe_tagway[0].contentWindow.Backbone);
            //    if (!$this.ui.iframe_tagway[0].contentWindow.Backbone) console.log("******** no create");
            //    $this.ui.iframe_tagway[0].contentWindow.Backbone.trigger('Tagway.View.App:getSessionTagWay', email);
            //}, 3000);
        },
        // признак открытого окна какого либо модуля
        isShowModule: false,
        // признак загружен ли тегвей
        isLoadModule: false,

        // селектор iframe который открыт
        iframeOpen: null,
        openTagWayFrame: function (goToPhone) {
            console.log("WEBPassport.Views.ModuleTagWayController:openTagWayFrame");
            var $this = this;

            //if (wlPath == "PayLeh") {
             ShowAlert(i18n.t('wbs_coming_soon_label'));
             //currentPageName = "";
             return true;
            //}

            if (!WEBPassport.mainViewModel.attributes.email)
            {
                var backgroundColor = $($(".widget_WebPassport_2_2")[0]).css("background-color");
                backgroundColor = backgroundColor ? backgroundColor : $($(".widget")[0]).css("background-color");

                mobipayNavigatorOpen(mobipayPage.webpassport, "lift",
                           {
                               backgroundColor: backgroundColor,
                               action: "WEBPassport.Views.ModuleTagWayController:getSessionTagWay",
                               type: "tagway"
                           }
                       );
            }

            else
            {
                var callback = function () {
                    $this.isShowModule = true;
                    $this.iframeOpen = $this.ui.iframe_tagway.selector;

                    $this.ui.div_iframe_tagway.css('z-index', '11');

                    $this.ui.div_iframe_tagway.show();
                    $this.ui.div_iframe_tagway.removeClass("slideOutRightArshe").addClass("slideInRightArshe");
                    setTimeout(function () {
                        $this.ui.div_iframe_tagway.removeClass("slideInRightArshe")
                    }, 400);

                    if (goToPhone) {
                        var intervalS = setInterval(function () {
                            if (!$this.ui.iframe_tagway[0].contentWindow.Tagway.View.category ||!$this.ui.iframe_tagway[0].contentWindow.Tagway.View.category.childCategory ||
                                !$this.ui.iframe_tagway[0].contentWindow.Tagway.View.category.childCategory.CategoriesWidgetList)
                                return;

                        var data=new Backbone.Model({
                            description:i18n.t('wbs_deposit_with_no_commission'),
                            icon:'images/operators.png'
                        });

                            clearInterval(intervalS);
                            $this.ui.iframe_tagway[0].contentWindow.Backbone.trigger('Tagway.View.Category:openMobile', data);


                        }, 10);

                        $this.ui.iframe_tagway[0].contentWindow.goToPhone = goToPhone;
                    }
                    else
                        $this.ui.iframe_tagway[0].contentWindow.Backbone.trigger('Tagway.View.App:openFrameAndRefrash');
                }
                $this.checkingDownloadedModule(callback, true);
            }
        },
        checkingDownloadedModule: function (callback, showSpinner) {
            console.log("WEBPassport.Views.ModuleTagWayController:checkingDownloadedModule");

            if (showSpinner)
                ShowLoader();

            var $this = this;
            $this.setIntervalOpenForm = setInterval(function () {
                if ($this.isLoadModule){
                    clearInterval($this.setIntervalOpenForm);

                    callback();

                    if (showSpinner)
                        HideLoader();
                }
            },100);
        },
        openTagWayFramePaySuccess: function () {
            console.log("WEBPassport.Views.ModuleTagWayController:openTagWayFramePaySuccess");

            var $this = this;

            if ($this.ui.iframe_tagway.attr("src") != $this.moduleTagWayUrl)
                $this.ui.iframe_tagway.attr("src", $this.moduleTagWayUrl);
            var callback = function () {
                $this.isShowModule = true;
                $this.iframeOpen = $this.ui.iframe_tagway.selector;
                $this.ui.div_iframe_tagway.css('z-index', '11');
                $this.ui.div_iframe_tagway.show();
                $this.ui.iframe_tagway[0].contentWindow.Backbone.trigger('Tagway.View.App:openCartInfo');
            }
            $this.checkingDownloadedModule(callback,false);
        },
        closeTagWayFrame: function () {
            console.log("WEBPassport.Views.ModuleTagWayController:closeTagWayFrame");
            var $this = this;

            this.closeFrame();
            $this.ui.div_iframe_tagway.removeClass("slideInRightArshe").addClass("slideOutRightArshe");
            setTimeout(function () {
                $this.ui.div_iframe_tagway.css('z-index', '');
                //$this.ui.div_iframe_tagway.hide();
                $this.ui.div_iframe_tagway.removeClass("slideOutRightArshe")
            }, window.settings.isEffects ? timeoutRender : 0);
        },
        closeAndClearTagWayFrame: function () {
            console.log("WEBPassport.Views.ModuleTagWayController:closeAndClearTagWayFrame");
            var $this = this;

            this.closeFrame();
            $this.ui.div_iframe_tagway.removeClass("slideInRightArshe").addClass("slideOutRightArshe");
            setTimeout(function () {
                $this.ui.div_iframe_tagway.css('z-index', '');
                //$this.ui.div_iframe_tagway.hide();
            }, window.settings.isEffects ? timeoutRender : 0);

            this.ui.iframe_tagway.attr("src", "");
        },
        sendToIframeBackButton: function()
        {
            console.log("WEBPassport.Views.ModuleTagWayController:sendToIframeBackButton");
            var $this = this;

            var callback = function () {
                //ищем открытый фрейм и отправляем ему event BackButton
                for (i in $this.ui) {
                    if ($this.iframeOpen == $this.ui[i].selector) {
                        ($this.ui[i])[0].contentWindow.ons._onsenService.DeviceBackButtonHandler._callback();
                        return false;
                    }
                }
            }
            $this.checkingDownloadedModule(callback, false);
        },
        closeFrame:function()
        {
            console.log("WEBPassport.Views.ModuleTagWayController:closeFrame");
            this.isShowModule = false;
            this.iframeOpen = null;
        }
    });

    //инициализируем вьюшку для контроля открытия/закрытия модулей
    WEBPassport.Views.moduleTagWayController = new WEBPassport.Views.ModuleTagWayController()
});
ons.ready(function () {
    //Вьюшка для медиатор модуля Telegram
    WEBPassport.Views.ModuleTelegramController = Marionette.ItemView.extend({
        el: 'body',
        initialize: function () {
            console.log("WEBPassport.Views.ModuleTelegramController:initialize");

            ////загрузка ферйма(событие)
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTelegramController:onloadTelegram', this.onloadTelegram);

            //закрытие фрейма с тегвеем
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTelegramController:closeFrame', this.closeFrame);

            //закрытие фрейма с тегвеем и очистка фрейма
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTelegramController:closeAndClearFrame', this.closeAndClearFrame);

            //открытие фрейма с тегвеем
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTelegramController:openFrame', this.openFrame);

            //передаем во фрейм event BackButton
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTelegramController:sendToIframeBackButton', this.sendToIframeBackButton);

            //открываем ссылку с telegram
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTelegramController:handleURL', this.handleURL);

            //сохраняем сессию telegram
            this.listenTo(Backbone, 'WEBPassport.Views.ModuleTelegramController:saveSession', this.saveSession);

            //построить/привязать UI елементы
            this.bindUIElements();

            //_.bindAll(this, 'onSuccessPaymentQR');

            //ссыkки на модули
            this.moduleUrl = "../www/Telegram/index.html";

            if (ons.platform.isIOS()) {
                this.ui.iframe_telegram.css({
                    "height": window.innerHeight - 20 + "px"
                });
                window.innerHeightForTelegram = window.innerHeight - 20;
            }
            else
                window.innerHeightForTelegram = window.innerHeight;
        },
        ui: {
            div_iframe_telegram: "#div-iframe-telegram", // блок div с iframe для telegram
            iframe_telegram: "#iframe-telegram",// iframe для telegram
        },
        //changeLanguage: function () {
        //    console.log("WEBPassport.Views.ModuleTelegramController:changeLanguage");

        //    var $this = this;

        //    var callback = function () {
        //        $this.ui.iframe_telegram[0].contentWindow.Backbone.trigger('Tagway.View.App:changeLanguage');
        //    }
        //    $this.checkingDownloadedModule(callback, false);
        //},

        onloadTelegram: function () {

        },

        // признак открытого окна модуля
        isShowModule: false,
        // признак загружен ли модуль
        isLoadModule: false,

        // селектор iframe который открыт
        iframeOpen: null,

        openFrame: function (goToChat) {
            console.log("WEBPassport.Views.ModuleTagWayController:openFrame goToChat:" + goToChat);

            var $this = this;

            if (WEBPassport.mainViewModel.isPhoneValid())
            {
                $this.isShowModule = true;
                $this.iframeOpen = $this.ui.iframe_telegram.selector;

                $this.ui.div_iframe_telegram.css('z-index', '11');

                $this.ui.div_iframe_telegram.show();
                $this.ui.div_iframe_telegram.removeClass("slideOutRightArshe").addClass("slideInRightArshe");
                setTimeout(function () {
                    $this.ui.div_iframe_telegram.removeClass("slideInRightArshe")
                }, 600);

                localStorage.goToChat = goToChat ? goToChat : "";

                $this.ui.iframe_telegram.attr("src", $this.moduleUrl);
                $this.isLoadModule = true;
            }
            else {
                //добавляем кошелек, потом открываем чат
                mobipayNavigatorOpen(mobipayPage.new_wallet, "lift", { newWalletOption: 'telegram' });
            }
        },

        checkingDownloadedModule: function (callback, showSpinner) {
            console.log("WEBPassport.Views.ModuleTelegramController:checkingDownloadedModule");

            //if (showSpinner)
            //    ShowLoader();

            var $this = this;
          //  $this.setIntervalOpenForm = setInterval(function () {
               // if ($this.isLoadModule){
                 //   clearInterval($this.setIntervalOpenForm);

                    callback();

                    //if (showSpinner)
                    //    HideLoader();
            //    }
           // },10);
        },

        closeFrame: function () {
            console.log("WEBPassport.Views.ModuleTelegramController:closeFrame");
            var $this = this;
            HideLoader();
            this._closeFrame();
            //FIXED FOR IOS ARSHE 01.07.16
            if (window.Keyboard) window.Keyboard.hide();

            $this.ui.div_iframe_telegram.removeClass("slideInRightArshe").addClass("slideOutRightArshe");
            setTimeout(function () {
                $this.ui.div_iframe_telegram.css('z-index', '');
               // $this.ui.div_iframe_telegram.hide();
                $this.ui.div_iframe_telegram.removeClass("slideOutRightArshe")
            }, window.settings.isEffects ? timeoutRender : 0);
        },

        closeAndClearFrame: function () {
            console.log("WEBPassport.Views.ModuleTelegramController:closeAndClearFrame");
            var $this = this;

            this._closeFrame();
            $this.ui.div_iframe_telegram.removeClass("slideInRightArshe").addClass("slideOutRightArshe");
            setTimeout(function () {
                $this.ui.div_iframe_telegram.css('z-index', '');
                //$this.ui.div_iframe_telegram.hide();
            }, window.settings.isEffects ? timeoutRender : 0);

            this.ui.iframe_telegram.attr("src", "");
        },

        sendToIframeBackButton: function()
        {
            console.log("WEBPassport.Views.ModuleTelegramController:sendToIframeBackButton");
            var $this = this;

            var callback = function () {
                //ищем открытый фрейм и отправляем ему event BackButton
                for (i in $this.ui) {
                    if ($this.iframeOpen == $this.ui[i].selector) {
                        if (($this.ui[i])[0].contentWindow.location.hash == "#/im" ||
                            ($this.ui[i])[0].contentWindow.location.hash == "#/login")
                        {
                            $this.closeFrame();
                        }
                        else
                        {
                            ($this.ui[i])[0].contentWindow.window.history.back();
                        }

                        return false;
                    }
                }
            }
            $this.checkingDownloadedModule(callback, false);
        },
        _closeFrame:function()
        {
            console.log("WEBPassport.Views.ModuleTelegramController:closeFrame");
            this.isShowModule = false;
            this.iframeOpen = null;
        },

        // открываем ссылку с телеграмм
        handleURL:function(url)
        {
            console.log("WEBPassport.Views.ModuleTelegramController:handleURL url:" + url);
            this.closeFrame();
            Backbone.trigger('WEBPassport.Views.MainView:handleURL', { url: url });
        },

        // открываем ссылку с телеграмм
        saveSession: function () {
            console.log("WEBPassport.Views.ModuleTelegramController:saveSession ");

            window.settings.telegram = {
                user_auth: localStorage["user_auth"],
                dc: localStorage["dc"],
                dc2_auth_key: localStorage["dc2_auth_key"],
                dc2_server_salt: localStorage["dc2_server_salt"],
            };

            WEBPassport.requestModel.settingsSave(JSON.stringify(window.settings));

        },

    });

    //инициализируем вьюшку для контроля открытия/закрытия модулей
    WEBPassport.Views.moduleTelegramController = new WEBPassport.Views.ModuleTelegramController()
});
ons.ready(function () {

    WEBPassport.Views.DialogFeedbackError = Marionette.ItemView.extend({
        ui: {
            send_log_btn: "#send_log_btn", // кнопка для отправки лога
        },
        initialize: function () {
            console.log("WEBPassport.Views.DialogFeedbackError:initialize");
            this.listenTo(Backbone, "WEBPassport.Views.DialogFeedbackError:FeedbackError", this.feedbackError);
            this.bindUIElements();
        },
        events: {
            "click @ui.send_log_btn": "sendLog",
        },

        // клик на кнопку для отправки лога
        sendLog: function () {
            console.log("WEBPassport.Views.DialogFeedbackError:sendLog");

            l2i.download();
            this.dialog.hide();
        },

        feedbackError: function () {
            console.log("WEBPassport.Views.DialogFeedbackError:feedbackError");

            HideLoader();
            this.dialog.show();
        },

    });

    ons.createDialog('dialog_feedback_error').then(function (dialog) {
        dialog.getDeviceBackButtonHandler().disable();

        window.dialogFeedbackError = new WEBPassport.Views.DialogFeedbackError({
            el: dialog._element[0],
            model: new Backbone.Model(),
        });
        window.dialogFeedbackError.dialog = dialog;
    });

    // ******************** ВЫПАДАЮЩИЙ СПИСОК ******************** //
    // вьюшка диалога для выпадающего списка
    WEBPassport.Views.HelpersDropDownList = Marionette.ItemView.extend({
        ui: {
            list_options: "#list_options"
        },
        initialize: function (options) {
            console.log("WEBPassport.Views.HelpersDropDownList:initialize");
            this.bindUIElements();

            // уничтожить все данные
            this.listenTo(Backbone, options.model.get("destroyTrigger"), this.destroyView);

            // рендерим
         //   this.listenTo(Backbone, 'WEBPassport.Views.HelpersDropDownList:render_' + options.model.get("id"), this.renderData);

            SelectOptionsItem.prototype.template = this.model.attributes.templateSelectItem;

            this.selectOptionsCollectionView = new SelectOptionsCollectionView({
                collection: new Backbone.Collection(this.model.attributes.list),
                el: this.ui.list_options,
                selectId: this.model.attributes.id,
                destroyTrigger: this.model.attributes.destroyTrigger,
                selectedTrigger: this.model.attributes.selectedTrigger,
            }).render();
        },
        renderData: function (data) {
            console.log("WEBPassport.Views.HelpersDropDownList:renderData data:" + data ? JSON.stringify(data) : "");

            // отмечаем выбранный элемент
            this.selectOptionsCollectionView.collection.models.forEach(function (a) {
                a.attributes.active = a.attributes.value == data.value ? true : false;
            });
            this.selectOptionsCollectionView.render();

            this.dialog.hide();
        },
        destroyView: function () {
            console.log("WEBPassport.Views.HelpersDropDownList:destroyView");
            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    // вьюшка опций
    var SelectOptionsItem = Marionette.ItemView.extend({
        template: "#template_settings_select_options_item",
        tagName: "ons-list-item",
        attributes: {
            "modifier": "tappable",
        },
        initialize: function (options) {
            console.log("WEBPassport.Views.HelpersDropDownList.SelectOptionsItem:initialize model: " + this.model.attributes ? JSON.stringify(this.model.attributes) : "");

            // уничтожить все данные
            this.listenTo(Backbone, this.options.destroyTrigger, this.destroyView);

            this.bindUIElements();
        },
        events: {
            "click": "selectOptions",
        },
        selectOptions: function () {
            console.log("WEBPassport.Views.HelpersDropDownList.SelectOptionsItem:selectOptions value = " + this.model.attributes.value);

            Backbone.trigger( this.options.selectedTrigger + ':render_' + this.options.selectId, this.model.attributes);
           // Backbone.trigger('WEBPassport.Views.HelpersDropDownList:render_' + this.options.selectId, this.model.attributes);
        },
        destroyView: function () {
            console.log("WEBPassport.Views.HelpersDropDownList.SelectOptionsItem:destroyView");
            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    // коллекция опций
    var SelectOptionsCollectionView = Marionette.CollectionView.extend({
        childView: SelectOptionsItem,
        onRender: function () {
            console.log("WEBPassport.Views.HelpersDropDownList.SelectOptionsCollectionView:onRender");
            ons.compile(this.$el.get(0));
        },
        childViewOptions: function (model) {
            return {
                selectId: this.options.selectId,
                destroyTrigger: this.options.destroyTrigger,
                selectedTrigger: this.options.selectedTrigger
            }
        }
    });

    // ******************** ВЫБОР КАРТЫ ************************** //

    var SelectCardItem = Marionette.ItemView.extend({
        template: "#template_selectcard_item",
        className: "cart_block",
        ui: {
            card_content: "#card_content",
            label_number: "#label_number"
        },
        initialize: function (options) {
            console.log("WEBPassport.Views.SelectCardItem:initialize");
            // уничтожить все данные
            this.listenTo(Backbone, this.options.destroyTrigger, this.destroyView);

            this.bindUIElements();
        },
        onRender: function () {
            console.log("WEBPassport.Views.SelectCardItem:onRender model: " + this.model.attributes ? JSON.stringify(this.model.attributes) : "");
            this.ui.label_number.unmask().mask("00** **** **** 0000", { reverse: true });
            this.$el.i18n();
        },
        events: {
            "click": "selectCard",
        },
        selectCard: function () {
            console.log("WEBPassport.Views.SelectCardItem:selectCard");

            Backbone.trigger(this.options.selectedTrigger + ':selectedCard', this.model.attributes);
            Backbone.trigger(this.options.selectedTrigger + ":back_to_func_pay");
        },
        destroyView: function () {
            console.log("WEBPassport.Views.SelectCardItem:destroyView");
            this.stopListening();
            this.undelegateEvents();
            this.destroy();
        },
    });

    // коллекция для списка карт
    WEBPassport.Views.SelectCardCollectionView = Marionette.CollectionView.extend({
        childView: SelectCardItem,
        onRender: function () {
            console.log("WEBPassport.Views.SelectCardCollectionView:onRender");
            this.$el.i18n();
        },
        childViewOptions: function (model) {
            return {
                destroyTrigger: this.options.destroyTrigger,
                selectedTrigger: this.options.selectedTrigger
            }
        }
    });

    WEBPassport.Views.SelectedCard = Marionette.ItemView.extend({
        template: "#template_selected_card",
        ui: {
            label_number: "#label_number",
        },
        events: {
            'click': 'showListCard', // нажатие настроку для выбора карты
        },
        initialize: function () {
            console.log("WEBPassport.Views.SelectedCard:initialize");
            this.bindUIElements();
        },
        showListCard: function () {
            console.log("WEBPassport.Views.SelectedCard:showListCard");
            Backbone.trigger(this.options.selectedTrigger + ":showListCard");
        },
        onRender: function () {
            console.log("WEBPassport.Views.SelectedCard:onRender model: " + this.model.attributes ? JSON.stringify(this.model.attributes) : "");
            this.ui.label_number.unmask().mask("00**  ****  ****  0000", { reverse: true });
            ons.compile(this.$el.get(0));
            this.$el.i18n();
        }
    });
});
var pushNotification;

// �������� ������ ��� �����
if (!isMobile) {
    device = {
        available: true,
        cordova: "3.6.4",
        manufacturer: "Meizu",
        model: "m2 note",
        platform: "Android",
        uuid: "444bdf7778d78625",
        version: "5.1"
    };

    localStorage.uimei = "334bf8ca771fa6b9";
    localStorage.devType = 'Mobile';
    localStorage.imei = device.uuid;
    localStorage.os = "Android";
    localStorage.lang = "ru";
}

var app = {
    // Application Constructor
    initialize: function () {
        console.log('app:initialize');

        //TODO ��������
        //window.alert = function () { };
        //get IP
        $.getJSON('http://jsonip.com/?callback=?', function (r) { console.log(r.ip); localStorage.ip = r.ip; });

        // �������� ��������
        if (localStorage[settingApp])
            window.settings = JSON.parse(localStorage[settingApp]);
        else
            window.settings = settingsDefault;


        if (!isMobile) {
            window.settings.lang.forEach(function (a) {
                if (a.active)
                    localStorage.lang = a.value;
            });

            i18n.init({ lng: localStorage.lang, resGetPath: 'js/locales/__lng__/__ns__.json', debug: true }, function (err, t) {
                $(document).i18n();
            });

            moment.locale(localStorage.lang);

            ons.bootstrap();
        }

        function initL2I() {
            console.log('l2i initialized');
            l2i.init(
                function () {// successfully initialized
                    l2i.on(function () {
                        console.log('l2i successfully initialized');
                        l2i.clear();
                    });
                },
                function () {//fail
                    console.log('l2i fail initialized');
                    setTimeout(function () { initL2I(); }, 1000);
                }
           );
        };
        initL2I();


        this.bindEvents();

    },

    bindEvents: function () {
        console.log('app:bindEvents');
        document.addEventListener('deviceready', this.onDeviceReady, false);
        //document.addEventListener('backbutton', this.onBackButtonTap, false);
        document.addEventListener("pause", this.onPause, false);
        document.addEventListener("resume", this.onResume, false);
    },

    onDeviceReady: function () {
        console.log('app:deviceready');

        navigator.globalization.getLocaleName(
           function (loc) {

               var systemLang = loc.value.substring(0, 2);
               console.log('navigator.globalization.getLocaleName systemLang: ' + systemLang);
               console.log('navigator.globalization.getLocaleName loc: ' + loc.value);

               if (!localStorage.loc)
                   localStorage.loc = systemLang;

               if (!localStorage.lang) {
                   localStorage.lang = getLangInArr(systemLang) ? systemLang : "en";

                   //TODO
                   if (wlPath == "DreamClub")
                       localStorage.lang = "ru";
               }
               window.settings.lang.forEach(function (a) {
                   a.active = a.value == localStorage.lang ? true : false;
               });

               i18n.init({ lng: localStorage.lang, resGetPath: 'js/locales/__lng__/__ns__.json', debug: true }, function (err, t) {
                   $(document).i18n();
               });

               moment.locale(localStorage.lang);

               plugins.appPreferences.store(function () { console.log('locale stored') }, function () { console.log('locale storing error') }, 'applang', localStorage.lang);

               if (device.platform.toLowerCase() == 'android' || device.platform.toLowerCase() == "amazon-fireos")
                   window.plugins.uilanguage.switchLanguage(localStorage.lang, function (successEvent) { console.log('success language') }, function (errorEvent) { console.log('error language') });

               ons.bootstrap();
           },
           function () {
               console.log("navigator.globalization.getLocaleName: ERROR");
           });

        $.ajaxSetup({ timeout: 30000 });
        localStorage.imei = device.uuid;
        pushNotification = window.plugins.pushNotification;

        switch (device.platform.toLowerCase()) {
            case 'android':
                {
                    localStorage.os = "Android";

                    pushNotification.register(
                       successHandler,
                       errorHandler,
                       {
                           "senderID": pushNotifiSenderID,
                           "ecb": "onNotification"
                       });

                    break;
                }
            case 'ios':
                {
                    localStorage.os = "iOS";
                    Keyboard.hideFormAccessoryBar(true);

                    pushNotification.register(
                       tokenHandler,
                       errorHandler,
                       {
                           "badge": "true",
                           "sound": "true",
                           "alert": "true",
                           "ecb": "onNotificationAPN"
                       });

                    break;
                }
            default:
                {
                    if (device.platform.toLowerCase().indexOf('windows') > -1) {
                        localStorage.os = "Windows";
                    }
                    break;
                }
        }

        if (navigator.userAgent.indexOf('Mobile') > -1) {
            localStorage.devType = 'Mobile';
        }
        else {
            localStorage.devType = 'Tablet';
        }

        window.analytics.startTrackerWithId('UA-85712857-3');
    },

    onBackButtonTap: function () {
        console.log('app:onBackButtonTap');
        Backbone.trigger('mainview:backbuttontap');
    },

    onPause: function () {
        console.log('app:pause');
    },

    onResume: function () {
        console.log('app:resume');

        Backbone.trigger('mainview:resumeApp');
    }
};

window.onload = run;

function run() {
    app.initialize();
}


function successHandler(result) {
    console.log('successHandler result = ' + result);
}

// result contains any error description text returned from the plugin call
function errorHandler(error) {
    console.log('errorHandler error = ' + error);
}

// Android and Amazon Fire OS
function onNotification(e) {
    console.log("onNotification e.event:" + e.event);
    switch (e.event) {
        case 'registered':
            if (e.regid.length > 0) {
                // Your GCM push server needs to know the regID before it can push to this device
                // here is where you might want to send it the regID for later use.
                console.log("regID = " + e.regid);
                localStorage.pushId = e.regid;
            }
            break;

        case 'message':
            // if this flag is set, this notification happened while we were in the foreground.
            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
            Backbone.trigger('mainview:updateNotifications');
            if (e.foreground) {

                // on Android soundname is outside the payload.
                // On Amazon FireOS all custom attributes are contained within payload
                var soundfile = e.soundname || e.payload.sound;
                // if the notification contains a soundname, play it.
                var my_media = new Media("/android_asset/www/" + soundfile);
                my_media.play();
            }
            else {  // otherwise we were launched because the user touched a notification in the notification tray.
                if (e.coldstart) {
                    $("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
                }
                else {
                    $("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
                }
            }

            console.log('MSG: ' + e.payload.message);
            //Only works for GCM
            console.log('MSGCNT: ' + e.payload.msgcnt);
            //Only works on Amazon Fire OS
            //$status.append('<li>MESSAGE -> TIME: ' + e.payload.timeStamp + '</li>');
            break;

        case 'error':
            console.log('MSG:' + e.msg);
            break;

        default:
            console.log('Unknown, an event was received and we do not know what it is');
            break;
    }
}

function onNotificationAPN(event) {
    console.log("onNotificationAPN");

    if (event.alert) {
        ShowAlert(event.alert);
    }

    //if (event.sound) {
    //    var snd = new Media(event.sound);
    //    snd.play();
    //}

    //if (event.badge) {
    //    pushNotification.setApplicationIconBadgeNumber(successHandler, errorHandler, event.badge);
    //}
}

function tokenHandler(result) {
    console.log("tokenHandler result:" + result);
    // Your iOS push server needs to know the token before it can push to this device
    // here is where you might want to send it the token for later use.
   // alert('device token = ' + result);
    localStorage.pushId = result;
}


function smsError() {
    console.log('sms error callback');
    //listenSMS();
}

function listenSMS(smsSuccess) {
    console.log('listem SMS');
    if (isMobile && device.platform.toLowerCase() == 'android') {
        window.plugins.smsplugin.startRecieve(
            smsSuccess,
            smsError);
    }
}
function stopListenSMS() {
    console.log('listem SMS');
    if (isMobile && device.platform.toLowerCase() == 'android') {
        window.plugins.smsplugin.stopRecieve(null, null);
    }
}
